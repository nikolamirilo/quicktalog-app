import { CatalogueSession } from "@/agent/core/session";
import { UNTRUSTED_OPEN } from "@/agent/plugins/web";
import { buildTools } from "@/agent/tools";
import { findStockPhoto } from "@/lib/images/stock-photo";
import { saveOwnTheme } from "@/lib/themes/upsert";
import type { AgentToolResult, AiSectionAccess } from "@/types/ai";
import type { Catalogue } from "@quicktalog/common";
import { DEFAULT_IMAGE, defaultCatalogueData } from "@quicktalog/common";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { lookup } = vi.hoisted(() => ({ lookup: vi.fn() }));
vi.mock("node:dns/promises", () => ({ lookup }));

vi.mock("@/lib/images/stock-photo", () => ({ findStockPhoto: vi.fn() }));

vi.mock("@/lib/themes/upsert", () => ({ saveOwnTheme: vi.fn() }));
vi.mock("@/lib/auth/identity", () => ({
	getVerifiedIdentity: vi.fn().mockResolvedValue({
		userId: "user-1",
		sessionId: null,
	}),
}));

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
	sectionType: "custom_visual",
	name: "Counter",
	code: "<div class='qt-x'>hi</div>",
};

/** Code sections are gated, so a test that exercises them must grant them. */
const FULL_ACCESS: AiSectionAccess = {
	divider: true,
	embedding: true,
	customVisual: true,
};

describe("skill gate through the real tools", () => {
	it("refuses a code write before the skill is read, then allows it after", async () => {
		const session = new CatalogueSession(catalogue, {}, FULL_ACCESS);
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
			sectionType: "items",
			name: "Drinks",
			items: [],
		});

		expect(result).toMatchObject({ ok: true });
	});

	it("leaves loadSkill itself ungated", async () => {
		const tools = buildTools(new CatalogueSession(catalogue, {}, FULL_ACCESS));

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
		await run(tools, "addSection", { sectionType: "items", name: "Drinks" });

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
		const session = new CatalogueSession(catalogue, {}, FULL_ACCESS);
		const tools = buildTools(session);
		await run(tools, "loadSkill", { name: "responsive-design" });

		await run(tools, "fetchUrl", { url: "https://cafe.test/menu" });

		expect(await run(tools, "addSection", WIDGET)).toMatchObject({ ok: true });
		expect(
			await run(tools, "addSection", { sectionType: "items", name: "Tea" }),
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
	const search = vi.mocked(findStockPhoto);

	const found = (url: string) => ({ status: "found" as const, url });
	const NONE = { status: "none" as const };

	const WATCHES = `${PAGE}\n\n[![Tissot PRX](https://cdn.shop.test/prx.jpg)](https://shop.test/prx)\n\nTissot PRX 84900`;

	const itemsOf = (result: AgentToolResult) =>
		(result as unknown as { operation: { items: Record<string, unknown>[] } })
			.operation.items;

	/** The items as they stand on the session, after every edit of the turn. */
	const itemsIn = (session: CatalogueSession, index: number) =>
		(
			session.working.content[index] as {
				items: { id: string; image: string }[];
			}
		).items;

	it("puts the picture from a page read this turn on the item", async () => {
		mockScrape(WATCHES);
		const tools = buildTools(new CatalogueSession(catalogue));
		await run(tools, "fetchUrl", { url: "https://cafe.test/menu" });

		const result = await run(tools, "addSection", {
			sectionType: "items",
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
			sectionType: "items",
			name: "Watches",
			items: [{ name: "Tissot PRX", pageImage: 7 }],
		});

		expect(result).toMatchObject({ ok: true, imageMisses: ["Tissot PRX"] });
		expect(itemsOf(result)[0]).not.toHaveProperty("image");
	});

	it("runs every item's photo search, not just the first few", async () => {
		search.mockReset();
		search.mockImplementation(async (query) =>
			found(`https://images.test/${query}`),
		);
		const tools = buildTools(new CatalogueSession(catalogue));

		const result = await run(tools, "addSection", {
			sectionType: "items",
			name: "Watches",
			items: Array.from({ length: 30 }, (_, i) => ({
				name: `Watch ${i}`,
				imageQuery: `wrist watch ${i}`,
			})),
		});

		expect(search).toHaveBeenCalledTimes(30);
		expect(result).not.toHaveProperty("imageMisses");
	});

	it("fills in photos for items that already exist", async () => {
		search.mockReset();
		search.mockImplementation(async (query) =>
			found(`https://images.test/${query}`),
		);
		const session = new CatalogueSession(catalogue);
		const tools = buildTools(session);
		await run(tools, "addSection", {
			sectionType: "items",
			name: "Watches",
			items: [{ name: "Tissot PRX" }, { name: "Seiko 5" }],
		});

		const result = await run(tools, "addItemImages", {
			section: 0,
			items: [
				{ item: 0, imageQuery: "steel wrist watch" },
				{ item: 1, imageQuery: "automatic wrist watch" },
			],
		});

		expect(result).toMatchObject({ ok: true });
		expect(result).not.toHaveProperty("imageMisses");
		expect(itemsIn(session, 0).map((item) => item.image)).toEqual([
			"https://images.test/steel wrist watch",
			"https://images.test/automatic wrist watch",
		]);
	});

	// The whole point of the bulk tool: a missed search is retried with new
	// words, on items that are already in the catalogue.
	it("takes a second search for an item a first search missed", async () => {
		search.mockReset();
		search.mockResolvedValueOnce(NONE);
		search.mockResolvedValue(found("https://images.test/found.jpg"));
		const session = new CatalogueSession(catalogue);
		const tools = buildTools(session);
		await run(tools, "addSection", {
			sectionType: "items",
			name: "Watches",
			items: [{ name: "Tissot PRX", imageQuery: "prx" }],
		});

		const result = await run(tools, "addItemImages", {
			section: 0,
			items: [{ item: 0, imageQuery: "steel wrist watch" }],
		});

		expect(result).toMatchObject({ ok: true });
		expect(itemsIn(session, 0)[0].image).toBe("https://images.test/found.jpg");
	});

	it("keeps the photos it found when one item's index is wrong", async () => {
		search.mockReset();
		search.mockResolvedValue(found("https://images.test/found.jpg"));
		const session = new CatalogueSession(catalogue);
		const tools = buildTools(session);
		await run(tools, "addSection", {
			sectionType: "items",
			name: "Watches",
			items: [{ name: "Tissot PRX" }],
		});

		const result = await run(tools, "addItemImages", {
			section: 0,
			items: [
				{ item: 0, imageQuery: "steel wrist watch" },
				{ item: 9, imageQuery: "gold wrist watch" },
			],
		});

		expect(result).toMatchObject({ ok: true, imageMisses: ["item [9]"] });
		expect(itemsIn(session, 0)[0].image).toBe("https://images.test/found.jpg");
	});

	it("reports a section whose searches all missed instead of editing it", async () => {
		search.mockReset();
		search.mockResolvedValue(NONE);
		const session = new CatalogueSession(catalogue);
		const tools = buildTools(session);
		await run(tools, "addSection", {
			sectionType: "items",
			name: "Watches",
			items: [{ name: "Tissot PRX" }],
		});

		const result = await run(tools, "addItemImages", {
			section: 0,
			items: [{ item: 0, imageQuery: "steel wrist watch" }],
		});

		expect(result).toMatchObject({ ok: false });
		expect(itemsIn(session, 0)[0].image).toBe("");
	});

	it("does not count the template photo as a photo", async () => {
		const session = new CatalogueSession(catalogue);
		const tools = buildTools(session);
		await run(tools, "addSection", {
			sectionType: "items",
			name: "Watches",
			items: [{ name: "Tissot PRX" }],
		});
		session.run({
			op: "set_item_images",
			sectionId: session.working.content[0].id,
			images: [{ itemId: itemsIn(session, 0)[0].id, image: DEFAULT_IMAGE }],
		});

		const read = (await run(tools, "readSection", {
			section: 0,
		})) as unknown as {
			items: { hasImage: boolean }[];
		};

		expect(read.items[0].hasImage).toBe(false);
	});

	it("gives up on a photo search that hangs", async () => {
		vi.useFakeTimers();
		search.mockReset();
		search.mockReturnValue(new Promise(() => {}));
		const tools = buildTools(new CatalogueSession(catalogue));

		const pending = run(tools, "addSection", {
			sectionType: "items",
			name: "Watches",
			items: [{ name: "Tissot PRX", imageQuery: "steel wrist watch" }],
		});
		await vi.advanceTimersByTimeAsync(5000);

		// The item still lands; a service that will not answer is said once,
		// not as a miss per item.
		expect(await pending).toMatchObject({ ok: true });
		expect(await pending).toHaveProperty("imagesUnavailable");
	});

	// The bug this path exists for: Unsplash answered "Rate Limit Exceeded",
	// every item came back a miss, and the agent kept rewording the searches.
	it("stops searching once the photo service refuses, and says why", async () => {
		search.mockReset();
		search.mockResolvedValue({
			status: "unavailable",
			reason: "The stock photo service is rate limited right now.",
		});
		const tools = buildTools(new CatalogueSession(catalogue));

		const result = await run(tools, "addSection", {
			sectionType: "items",
			name: "Breakfast",
			items: Array.from({ length: 12 }, (_, i) => ({
				name: `Dish ${i}`,
				imageQuery: `dish ${i}`,
			})),
		});

		expect(search).toHaveBeenCalledTimes(1);
		expect(result).toMatchObject({
			ok: true,
			imagesUnavailable: "The stock photo service is rate limited right now.",
		});
		// Misses would read as "nothing matched" and invite another 12 searches.
		expect(result).not.toHaveProperty("imageMisses");
	});

	it("tells the agent to stop rather than retry when a retry cannot work", async () => {
		search.mockReset();
		search.mockResolvedValue({
			status: "unavailable",
			reason: "The stock photo service is rate limited right now.",
		});
		const tools = buildTools(new CatalogueSession(catalogue));
		await run(tools, "addSection", {
			sectionType: "items",
			name: "Breakfast",
			items: [{ name: "Croissant" }],
		});

		const result = await run(tools, "addItemImages", {
			section: 0,
			items: [{ item: 0, imageQuery: "butter croissant" }],
		});

		expect(result).toMatchObject({ ok: false });
		expect((result as { error: string }).error).toContain(
			"Do not search again on this turn",
		);
	});
});

describe("results", () => {
	it("says where a new section landed, so the next batch can find it", async () => {
		const tools = buildTools(new CatalogueSession(catalogue));
		await run(tools, "addSection", { sectionType: "items", name: "Drinks" });

		const result = await run(tools, "addSection", {
			sectionType: "items",
			name: "Watches",
			position: 0,
		});

		expect(result).toMatchObject({ ok: true, section: 0 });
	});

	// The client replays `operation`; the model only needs to know it landed.
	it("keeps the operation for the client but out of the model's context", async () => {
		const tools = buildTools(new CatalogueSession(catalogue));
		const output = await run(tools, "addSection", {
			sectionType: "items",
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
			summary: 'Added items section "Drinks"',
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
	const persist = vi.mocked(saveOwnTheme);

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
		expect(persist).toHaveBeenCalledWith(
			expect.objectContaining({ userId: "user-1" }),
			"Midnight",
			PALETTE,
		);
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
