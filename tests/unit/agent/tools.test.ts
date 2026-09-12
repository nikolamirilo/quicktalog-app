import { CatalogueSession } from "@/agent/session";
import { buildTools } from "@/agent/tools";
import { UNTRUSTED_OPEN } from "@/agent/web";
import type { AgentToolResult } from "@/types/ai";
import type { Catalogue } from "@quicktalog/common";
import { defaultCatalogueData } from "@quicktalog/common";
import { afterEach, describe, expect, it, vi } from "vitest";

const { lookup } = vi.hoisted(() => ({ lookup: vi.fn() }));
vi.mock("node:dns/promises", () => ({ lookup }));

vi.mock("@quicktalog/common", async () => {
	const actual =
		await vi.importActual<typeof import("@quicktalog/common")>(
			"@quicktalog/common",
		);
	return { ...actual, fetchImageFromUnsplash: vi.fn() };
});

const catalogue = { ...defaultCatalogueData, name: "cafe" } as Catalogue;

/** Enough text to clear the "almost nothing was extracted" floor. */
const PAGE = "Espresso 2.50. A short black coffee. ".repeat(10);

/** Answers Firecrawl with a page, so no test touches the network. */
const mockScrape = () => {
	lookup.mockResolvedValue([{ address: "93.184.216.34", family: 4 }]);
	vi.stubEnv("FIRECRAWL_API_KEY", "fc-test");
	return vi.spyOn(globalThis, "fetch").mockResolvedValue(
		new Response(
			JSON.stringify({
				success: true,
				data: { markdown: PAGE, metadata: { title: "Menu" } },
			}),
			{ status: 200 },
		),
	);
};

afterEach(() => {
	vi.unstubAllEnvs();
	vi.restoreAllMocks();
});

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

		mockScrape();

		for (const name of ["loadSkill", "readSection", "fetchUrl"] as const) {
			const input =
				name === "loadSkill"
					? { name: "responsive-design" }
					: name === "fetchUrl"
						? { url: "https://cafe.test/menu" }
						: { section: 0 };
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

describe("fetchUrl", () => {
	it("returns the page fenced off, and a line for the user", async () => {
		mockScrape();
		const tools = buildTools(new CatalogueSession(catalogue));

		const result = (await run(tools, "fetchUrl", {
			url: "https://cafe.test/menu",
		})) as unknown as Record<string, string>;

		expect(result.summary).toBe("Read cafe.test - Menu");
		expect(result.content).toContain(UNTRUSTED_OPEN);
		expect(result.content).toContain("Espresso 2.50");
	});

	it("spends nothing on the same page twice", async () => {
		const fetchMock = mockScrape();
		const tools = buildTools(new CatalogueSession(catalogue));

		await run(tools, "fetchUrl", { url: "https://cafe.test/menu" });
		await run(tools, "fetchUrl", { url: "https://cafe.test/menu" });

		expect(fetchMock).toHaveBeenCalledTimes(1);
	});

	// The whole point of the guard: a page cannot talk the agent into writing
	// markup onto a published catalogue, even once the skill has been read.
	it("closes code sections for the rest of a conversation that read a page", async () => {
		mockScrape();
		const session = new CatalogueSession(catalogue);
		const tools = buildTools(session);
		await run(tools, "loadSkill", { name: "responsive-design" });

		expect(await run(tools, "addSection", WIDGET)).toMatchObject({ ok: true });

		await run(tools, "fetchUrl", { url: "https://cafe.test/menu" });

		expect(await run(tools, "addSection", WIDGET)).toEqual({
			ok: false,
			error: expect.stringContaining("read a web page"),
		});
		// The ordinary path is untouched.
		expect(
			await run(tools, "addSection", { sectionType: "category", name: "Tea" }),
		).toMatchObject({ ok: true });
	});

	it("refuses an address that points back at our own network", async () => {
		const fetchMock = mockScrape();
		const tools = buildTools(new CatalogueSession(catalogue));

		expect(
			await run(tools, "fetchUrl", { url: "http://169.254.169.254/" }),
		).toMatchObject({ ok: false });
		expect(fetchMock).not.toHaveBeenCalled();
	});
});
