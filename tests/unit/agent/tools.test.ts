import { CatalogueSession } from "@/agent/session";
import { buildTools } from "@/agent/tools";
import type { AgentToolResult } from "@/types/ai";
import type { Catalogue } from "@quicktalog/common";
import { defaultCatalogueData } from "@quicktalog/common";
import { describe, expect, it, vi } from "vitest";

vi.mock("@quicktalog/common", async () => {
	const actual =
		await vi.importActual<typeof import("@quicktalog/common")>(
			"@quicktalog/common",
		);
	return { ...actual, fetchImageFromUnsplash: vi.fn() };
});

const catalogue = { ...defaultCatalogueData, name: "cafe" } as Catalogue;

const run = (
	tools: ReturnType<typeof buildTools>,
	name: keyof ReturnType<typeof buildTools>,
	input: unknown,
) =>
	(tools[name].execute as (i: unknown, o: unknown) => Promise<AgentToolResult>)(
		input,
		{},
	);

const WIDGET = {
	sectionType: "custom_code",
	name: "Counter",
	code: "<div class='qt-x'>hi</div>",
};

describe("skill gate through the real tools", () => {
	it("refuses a code write before the skill is read, then allows it after", async () => {
		const session = new CatalogueSession(catalogue);
		const tools = buildTools(session);

		const blocked = await run(tools, "addSection", WIDGET);
		expect(blocked).toEqual({
			ok: false,
			error: expect.stringContaining("responsive-design"),
		});
		// Nothing reached the catalogue.
		expect(session.operations).toHaveLength(0);

		await run(tools, "loadSkill", { name: "responsive-design" });

		const allowed = await run(tools, "addSection", WIDGET);
		expect(allowed).toMatchObject({ ok: true });
		expect(session.operations).toHaveLength(1);
	});

	it("does not gate a section that carries no code", async () => {
		const session = new CatalogueSession(catalogue);
		const tools = buildTools(session);

		const result = await run(tools, "addSection", {
			sectionType: "category",
			name: "Drinks",
			items: [],
		});

		expect(result).toMatchObject({ ok: true });
	});

	it("leaves loadSkill itself ungated", async () => {
		const tools = buildTools(new CatalogueSession(catalogue));

		expect(
			await run(tools, "loadSkill", { name: "responsive-design" }),
		).toEqual({
			skill: "responsive-design",
			content: expect.stringContaining("RESPONSIVE DESIGN:"),
		});
	});

	// The client replays `operation` from any result reporting ok:true, so a
	// reading tool must never borrow that shape.
	it("never returns ok:true without an operation to replay", async () => {
		const session = new CatalogueSession(catalogue);
		const tools = buildTools(session);
		await run(tools, "addSection", { sectionType: "category", name: "Drinks" });

		for (const name of ["loadSkill", "readSection"] as const) {
			const input =
				name === "loadSkill"
					? { name: "responsive-design" }
					: {
							section: 0,
						};
			const output = (await run(tools, name, input)) as Record<string, unknown>;

			expect(output.ok).not.toBe(true);
			expect(output.operation).toBeUndefined();
		}
	});

	it("still reports a bad index as a correctable error", async () => {
		const tools = buildTools(new CatalogueSession(catalogue));

		expect(
			await run(tools, "updateSection", { section: 7, name: "x" }),
		).toEqual({ ok: false, error: expect.stringContaining("no section [7]") });
	});
});
