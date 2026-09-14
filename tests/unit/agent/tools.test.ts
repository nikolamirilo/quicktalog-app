import { CatalogueSession } from "@/agent/session";
import { buildTools } from "@/agent/tools";
import { UNTRUSTED_OPEN } from "@/agent/web";
import type { AgentToolResult } from "@/types/ai";
import type { Catalogue } from "@quicktalog/common";
import {
	defaultCatalogueData,
	fetchImageFromUnsplash,
} from "@quicktalog/common";
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
const mockScrape = (markdown = PAGE) => {
	lookup.mockResolvedValue([{ address: "93.184.216.34", family: 4 }]);
	vi.stubEnv("FIRECRAWL_API_KEY", "fc-test");
	return vi.spyOn(globalThis, "fetch").mockResolvedValue(
		new Response(
			JSON.stringify({
				success: true,
				data: { markdown, metadata: { title: "Menu" } },
			}),
			{ status: 200 },
		),
	);
};

afterEach(() => {
	vi.useRealTimers();
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

describe("photos", () => {
	const unsplash = vi.mocked(fetchImageFromUnsplash);

	const WATCHES = `${PAGE}\n\n[![Tissot PRX](https://cdn.shop.test/prx.jpg)](https://shop.test/prx)\n\nTissot PRX 84900`;

	const itemsOf = (result: AgentToolResult) =>
		(result as unknown as { operation: { items: Record<string, unknown>[] } })
			.operation.items;

	it("puts the picture from a page read this turn on the item", async () => {
		mockScrape(WATCHES);
		const tools = buildTools(new CatalogueSession(catalogue));
		await run(tools, "fetchUrl", { url: "https://cafe.test/menu" });

		const result = await run(tools, "addSection", {
			sectionType: "container",
			name: "Watches",
			items: [{ name: "Tissot PRX", price: 84900, pageImage: 1 }],
		});

		expect(result).toMatchObject({ ok: true });
		expect(result).not.toHaveProperty("imageMisses");
		expect(itemsOf(result)[0].image).toBe("https://cdn.shop.test/prx.jpg");
	});

	// A number no page showed is a model slip, not a reason to lose the item.
	it("adds the item without a photo when its picture number does not exist", async () => {
		const tools = buildTools(new CatalogueSession(catalogue));

		const result = await run(tools, "addSection", {
			sectionType: "container",
			name: "Watches",
			items: [{ name: "Tissot PRX", pageImage: 7 }],
		});

		expect(result).toMatchObject({ ok: true, imageMisses: ["Tissot PRX"] });
		expect(itemsOf(result)[0]).not.toHaveProperty("image");
	});

	it("runs every item's photo search, not just the first few", async () => {
		unsplash.mockReset();
		unsplash.mockImplementation(
			async (query) => `https://images.test/${query}`,
		);
		const tools = buildTools(new CatalogueSession(catalogue));

		const result = await run(tools, "addSection", {
			sectionType: "container",
			name: "Watches",
			items: Array.from({ length: 30 }, (_, i) => ({
				name: `Watch ${i}`,
				imageQuery: `wrist watch ${i}`,
			})),
		});

		expect(unsplash).toHaveBeenCalledTimes(30);
		expect(result).not.toHaveProperty("imageMisses");
	});

	it("gives up on a photo search that hangs", async () => {
		vi.useFakeTimers();
		unsplash.mockReset();
		unsplash.mockReturnValue(new Promise(() => {}));
		const tools = buildTools(new CatalogueSession(catalogue));

		const pending = run(tools, "addSection", {
			sectionType: "container",
			name: "Watches",
			items: [{ name: "Tissot PRX", imageQuery: "steel wrist watch" }],
		});
		await vi.advanceTimersByTimeAsync(5000);

		expect(await pending).toMatchObject({
			ok: true,
			imageMisses: ["steel wrist watch"],
		});
	});
});

describe("results", () => {
	it("says where a new section landed, so the next batch can find it", async () => {
		const tools = buildTools(new CatalogueSession(catalogue));
		await run(tools, "addSection", { sectionType: "category", name: "Drinks" });

		const result = await run(tools, "addSection", {
			sectionType: "container",
			name: "Watches",
			position: 0,
		});

		expect(result).toMatchObject({ ok: true, section: 0 });
	});

	// The client replays `operation`; the model only needs to know it landed.
	it("keeps the operation for the client but out of the model's context", async () => {
		const tools = buildTools(new CatalogueSession(catalogue));
		const output = await run(tools, "addSection", {
			sectionType: "category",
			name: "Drinks",
		});

		const forModel = await (
			tools.addSection as unknown as {
				toModelOutput: (options: {
					toolCallId: string;
					input: unknown;
					output: unknown;
				}) => Promise<{ type: string; value: Record<string, unknown> }>;
			}
		).toModelOutput({ toolCallId: "call-1", input: {}, output });

		expect(output).toHaveProperty("operation");
		expect(forModel.type).toBe("json");
		expect(forModel.value).not.toHaveProperty("operation");
		expect(forModel.value).toMatchObject({
			ok: true,
			summary: 'Added category section "Drinks"',
		});
	});
});
