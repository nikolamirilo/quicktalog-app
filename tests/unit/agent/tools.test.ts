import { CatalogueSession } from "@/agent/session";
import { buildTools } from "@/agent/tools";
import { UNTRUSTED_OPEN } from "@/agent/web";
import type { AgentToolResult } from "@/types/ai";
import type { Catalogue } from "@quicktalog/common";
import {
	defaultCatalogueData,
	fetchImageFromUnsplash,
} from "@quicktalog/common";
import { upsertTheme } from "@/lib/themes/upsert";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { lookup } = vi.hoisted(() => ({ lookup: vi.fn() }));
vi.mock("node:dns/promises", () => ({ lookup }));

vi.mock("@quicktalog/common", async () => {
	const actual =
		await vi.importActual<typeof import("@quicktalog/common")>(
			"@quicktalog/common",
		);
	return { ...actual, fetchImageFromUnsplash: vi.fn() };
});

vi.mock("@/lib/themes/upsert", () => ({ upsertTheme: vi.fn() }));

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

	// This used to be refused outright. The fragment now runs in a sandboxed
	// frame with no same-origin access, so markup from a page cannot reach
	// anything worth reaching, and the work is allowed through.
	it("still writes code sections after a page has been read", async () => {
		mockScrape();
		const session = new CatalogueSession(catalogue);
		const tools = buildTools(session);
		await run(tools, "loadSkill", { name: "responsive-design" });

		await run(tools, "fetchUrl", { url: "https://cafe.test/menu" });

		expect(await run(tools, "addSection", WIDGET)).toMatchObject({ ok: true });
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

const PALETTE = {
	background: "#0f172a",
	heading: "#f8fafc",
	text: "#cbd5e1",
	primary: "#22d3ee",
	secondary: "#64748b",
	cardBackground: "#1e293b",
};

describe("setCustomTheme", () => {
	const persist = vi.mocked(upsertTheme);

	beforeEach(() => persist.mockReset());

	it("applies the palette, saves it, and reports the name to the model", async () => {
		persist.mockResolvedValue({
			success: true,
			data: {
				id: "theme-1",
				userId: "user-1",
				name: "Midnight",
				colors: PALETTE,
				createdAt: "2026-01-01T00:00:00Z",
				updatedAt: "2026-01-01T00:00:00Z",
			},
		});

		const session = new CatalogueSession(
			catalogue,
			{},
			undefined,
			[],
			"user-1",
		);
		const tools = buildTools(session);

		const result = await run(tools, "setCustomTheme", {
			name: "Midnight",
			colors: PALETTE,
		});

		expect(result).toMatchObject({
			ok: true,
			savedTheme: { name: "Midnight" },
		});
		expect(session.operations).toHaveLength(1);
		expect(persist).toHaveBeenCalledWith("user-1", "Midnight", PALETTE);
	});

	it("still applies the theme when the save fails, and surfaces a saveError", async () => {
		persist.mockResolvedValue({ success: false, error: "Database is down" });

		const session = new CatalogueSession(
			catalogue,
			{},
			undefined,
			[],
			"user-1",
		);
		const tools = buildTools(session);

		const result = await run(tools, "setCustomTheme", {
			name: "Midnight",
			colors: PALETTE,
		});

		expect(result).toMatchObject({
			ok: true,
			saveError: "Database is down",
		});
		expect(result).not.toHaveProperty("savedTheme");
		expect(session.operations).toHaveLength(1);
	});

	it("falls back to a saveError when no user is signed in", async () => {
		const tools = buildTools(new CatalogueSession(catalogue));

		const result = await run(tools, "setCustomTheme", {
			name: "Midnight",
			colors: PALETTE,
		});

		expect(result).toMatchObject({ ok: true, saveError: expect.any(String) });
		expect(persist).not.toHaveBeenCalled();
	});
});

describe("plan tools through the real wiring", () => {
	it("writes the list down and ticks it off", async () => {
		const session = new CatalogueSession(catalogue);
		const tools = buildTools(session);

		const created = await run(tools, "createPlan", {
			tasks: ["Add a drinks menu", "Translate everything"],
		});
		expect(created).toMatchObject({ ok: true, remaining: 2 });

		const done = await run(tools, "completeTask", {
			task: 0,
			note: "added 8 items",
		});
		expect(done).toMatchObject({ ok: true, remaining: 1 });
		expect(session.plan?.tasks[0]).toMatchObject({ status: "done" });
	});

	it("hands a bad task index back to the model to correct", async () => {
		const session = new CatalogueSession(catalogue);
		const tools = buildTools(session);
		await run(tools, "createPlan", { tasks: ["One", "Two"] });

		expect(await run(tools, "skipTask", { task: 9, reason: "nope" })).toEqual({
			ok: false,
			error: expect.stringContaining("no task [9]"),
		});
	});

	it("will not accept a one-item plan", () => {
		// A single change does not need a checklist, and a plan of one is a round
		// trip the user pays for and learns nothing from.
		const schema = buildTools(new CatalogueSession(catalogue)).createPlan
			.inputSchema as { safeParse: (value: unknown) => { success: boolean } };

		expect(schema.safeParse({ tasks: ["Just the one"] }).success).toBe(false);
		expect(schema.safeParse({ tasks: ["One", "Two"] }).success).toBe(true);
	});

	it("keeps the plan in what the model reads back", async () => {
		// `hideOperations` strips the replay payload from every tool result; the
		// plan is not one, and losing it would leave the model blind to its list.
		const tools = buildTools(new CatalogueSession(catalogue));
		const output = await run(tools, "createPlan", { tasks: ["One", "Two"] });
		const toModelOutput = (
			tools.createPlan as unknown as {
				toModelOutput: (arg: { output: unknown }) => { value: unknown };
			}
		).toModelOutput;

		expect(toModelOutput({ output }).value).toMatchObject({
			plan: { tasks: [{ title: "One" }, { title: "Two" }] },
		});
	});
});
