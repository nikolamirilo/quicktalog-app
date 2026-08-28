import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ fetchImageFromUnsplash: vi.fn() }));

vi.mock("@quicktalog/common", async (importOriginal) => ({
	...(await importOriginal<typeof import("@quicktalog/common")>()),
	fetchImageFromUnsplash: mocks.fetchImageFromUnsplash,
}));

import {
	allowedSectionTypes,
	buildCatalogueSnapshot,
	buildEditorSystemPrompt,
	catalogueEditResponseSchema,
	resolveOperationImages,
	toClientOperations,
} from "@/lib/ai/catalogueEditor";
import type { Catalogue, ContentBlock } from "@quicktalog/common";
import { defaultCatalogueData } from "@quicktalog/common";

const content: ContentBlock[] = [
	{
		id: "sec-1",
		order: 0,
		type: "category",
		name: "Starters",
		layout: "variant_1",
		isExpanded: true,
		items: [
			{
				id: "it-1",
				order: 0,
				name: "Bruschetta",
				description: "",
				image: "",
				price: 5,
			},
			{
				id: "it-2",
				order: 1,
				name: "Soup",
				description: "",
				image: "",
				price: 4,
			},
		],
	},
	{ id: "sec-2", order: 1, type: "text", content: "<p>About us</p>" },
];

const catalogue = {
	...defaultCatalogueData,
	id: "cat-1",
	name: "menu",
	content,
} as Catalogue;

describe("buildCatalogueSnapshot", () => {
	it("indexes sections and items so the model can address them", () => {
		const snapshot = buildCatalogueSnapshot(catalogue);

		expect(snapshot).toContain("SLUG: menu");
		expect(snapshot).toContain('[0] category "Starters"');
		expect(snapshot).toContain('[0] "Bruschetta"');
		expect(snapshot).toContain('[1] "Soup"');
		expect(snapshot).toContain("[1] text");
	});

	it("strips HTML out of text it shows the model", () => {
		const snapshot = buildCatalogueSnapshot(catalogue);

		expect(snapshot).toContain("About us");
		expect(snapshot).not.toContain("<p>");
	});
});

describe("toClientOperations", () => {
	it("swaps snapshot indices for stable ids", () => {
		const parsed = catalogueEditResponseSchema.parse({
			reply: "Done",
			operations: [
				{ op: "update_item", section: 0, item: 1, price: 9 },
				{ op: "delete_section", section: 1 },
			],
		});

		expect(toClientOperations(catalogue, parsed.operations)).toEqual([
			{
				op: "update_item",
				sectionId: "sec-1",
				itemId: "it-2",
				name: undefined,
				description: undefined,
				price: 9,
				isFree: undefined,
				denominator: undefined,
			},
			{ op: "delete_section", sectionId: "sec-2" },
		]);
	});

	it("drops operations that point past the end of the catalogue", () => {
		const parsed = catalogueEditResponseSchema.parse({
			operations: [
				{ op: "delete_section", section: 9 },
				{ op: "delete_item", section: 0, item: 7 },
				{ op: "add_items", section: 1, items: [{ name: "X" }] },
			],
		});

		// Section 1 is a text block, so it has no items to add to.
		expect(toClientOperations(catalogue, parsed.operations)).toEqual([]);
	});

	it("drops a cross-section move when the destination is unknown", () => {
		const parsed = catalogueEditResponseSchema.parse({
			operations: [{ op: "move_item", section: 0, item: 0, toSection: 5 }],
		});

		expect(toClientOperations(catalogue, parsed.operations)).toEqual([]);
	});

	it("rejects a response whose operations are not recognised", () => {
		const result = catalogueEditResponseSchema.safeParse({
			reply: "ok",
			operations: [{ op: "drop_database" }],
		});

		expect(result.success).toBe(false);
	});

	it("defaults to no operations when the model only talks", () => {
		const parsed = catalogueEditResponseSchema.parse({
			reply: "Which section?",
		});

		expect(parsed.operations).toEqual([]);
		expect(toClientOperations(catalogue, parsed.operations)).toEqual([]);
	});
});

const UNSPLASH_MISS =
	"https://static1.squarespace.com/static/5898e29c725e25e7132d5a5a/58aa11bc9656ca13c4524c68/58aa11e99656ca13c45253e2/1487540713345/600x400-Image-Placeholder.jpg?format=original";

describe("resolveOperationImages", () => {
	beforeEach(() => {
		mocks.fetchImageFromUnsplash.mockReset();
	});

	it("swaps each search term for a photo URL and drops the query", async () => {
		mocks.fetchImageFromUnsplash.mockResolvedValue(
			"https://images/espresso.jpg",
		);

		const [operation] = await resolveOperationImages([
			{
				op: "add_items",
				sectionId: "sec-1",
				items: [{ name: "Espresso", imageQuery: "espresso coffee cup" }],
			},
		]);

		expect(operation).toEqual({
			op: "add_items",
			sectionId: "sec-1",
			items: [{ name: "Espresso", image: "https://images/espresso.jpg" }],
		});
		expect(mocks.fetchImageFromUnsplash).toHaveBeenCalledWith(
			"espresso coffee cup",
		);
	});

	it("looks a repeated search term up only once", async () => {
		mocks.fetchImageFromUnsplash.mockResolvedValue("https://images/latte.jpg");

		await resolveOperationImages([
			{
				op: "add_items",
				sectionId: "sec-1",
				items: [
					{ name: "Latte", imageQuery: "latte" },
					{ name: "Iced Latte", imageQuery: "latte" },
				],
			},
			{
				op: "update_item",
				sectionId: "sec-2",
				itemId: "it-9",
				imageQuery: "latte",
			},
		]);

		expect(mocks.fetchImageFromUnsplash).toHaveBeenCalledTimes(1);
	});

	it("leaves the item untouched when Unsplash has no match", async () => {
		mocks.fetchImageFromUnsplash.mockResolvedValue(UNSPLASH_MISS);

		const [operation] = await resolveOperationImages([
			{
				op: "update_item",
				sectionId: "sec-1",
				itemId: "it-1",
				imageQuery: "something unfindable",
			},
		]);

		// No `image` key at all, so the applier will not overwrite what is there.
		expect(operation).toEqual({
			op: "update_item",
			sectionId: "sec-1",
			itemId: "it-1",
		});
	});

	it("does not touch Unsplash when no operation asked for a photo", async () => {
		const operations = await resolveOperationImages([
			{ op: "delete_section", sectionId: "sec-1" },
		]);

		expect(operations).toEqual([{ op: "delete_section", sectionId: "sec-1" }]);
		expect(mocks.fetchImageFromUnsplash).not.toHaveBeenCalled();
	});
});

describe("section type access", () => {
	it("offers every type when the plan unlocks them", () => {
		expect(
			allowedSectionTypes({ divider: true, embedding: true, customCode: true }),
		).toEqual([
			"category",
			"container",
			"text",
			"divider",
			"embedding",
			"custom_code",
		]);
	});

	it("hides locked types from the prompt and names them as unavailable", () => {
		const prompt = buildEditorSystemPrompt(catalogue, {
			divider: true,
			embedding: false,
			customCode: false,
		});

		expect(prompt).not.toContain('"embedding"|');
		expect(prompt).toContain(
			"cannot use these section types: embedding, custom_code",
		);
	});

	it("tells the model never to invent an embed source", () => {
		const prompt = buildEditorSystemPrompt(catalogue);

		expect(prompt).toContain("never invent a src");
	});

	it("tells the model to author custom code itself rather than ask for a URL", () => {
		const prompt = buildEditorSystemPrompt(catalogue);

		expect(prompt).toContain("original code you write yourself");
		expect(prompt).toContain("Write it without being asked for a URL");
		expect(prompt).toContain("no external scripts");
	});

	it("warns the model off unescaped catalogue text in JS literals", () => {
		const prompt = buildEditorSystemPrompt(catalogue);

		// An apostrophe in an item name is a syntax error that silently kills the
		// whole widget, so the data has to travel as JSON.
		expect(prompt).toContain(
			"Never paste catalogue text straight into a JavaScript string literal",
		);
		expect(prompt).toContain('script type="application/json"');
	});

	it("prefers a block's real name over a markup excerpt", () => {
		const named = {
			...defaultCatalogueData,
			id: "c",
			name: "cafe",
			content: [
				{
					id: "b1",
					order: 0,
					type: "custom_code",
					name: "Summer sale banner",
					code: '<div class="qt-banner"><h1>Summer Sale</h1></div>',
				},
			],
		} as Catalogue;

		const snapshot = buildCatalogueSnapshot(named);

		expect(snapshot).toContain("[0] custom_code — Summer sale banner");
		expect(snapshot).not.toContain("qt-banner");
	});

	it("tells the model a name is the accessible name for nameless types", () => {
		const prompt = buildEditorSystemPrompt(catalogue);

		expect(prompt).toContain("accessible name for screen readers");
	});

	it("makes code and embed blocks identifiable in the snapshot", () => {
		// They carry no name, so without a markup excerpt the model cannot tell a
		// banner it already built from an empty slot, and adds a second one.
		const withBanner = {
			...defaultCatalogueData,
			id: "c",
			name: "cafe",
			content: [
				{
					id: "b1",
					order: 0,
					type: "custom_code",
					code: '<div class="qt-banner"><h1>Summer Sale</h1></div>',
				},
			],
		} as Catalogue;

		const snapshot = buildCatalogueSnapshot(withBanner);

		expect(snapshot).toContain("[0] custom_code —");
		expect(snapshot).toContain("qt-banner");
		expect(snapshot).toContain("Summer Sale");
	});

	it("tells the model the snapshot already includes its earlier turns", () => {
		const prompt = buildEditorSystemPrompt(catalogue);

		expect(prompt).toContain("Never repeat an operation from an earlier turn");
	});

	it("tells the model to add new sections rather than overwrite existing ones", () => {
		const prompt = buildEditorSystemPrompt(catalogue);

		expect(prompt).toContain("Asking for something new means add_section");
		expect(prompt).toContain("Never overwrite an existing section");
	});

	it("requires DOM lookups scoped to the block's own root", () => {
		const prompt = buildEditorSystemPrompt(catalogue);

		// Two copies of a widget on one page collide on ids, and every copy after
		// the first renders blank with nothing in the console.
		expect(prompt).toContain("var root = document.currentScript.parentNode;");
		expect(prompt).toContain("do not give elements id attributes");
	});

	it("forbids load-event wrappers that would never fire", () => {
		const prompt = buildEditorSystemPrompt(catalogue);

		// The script is injected after load, so a DOMContentLoaded handler leaves
		// the widget blank with nothing in the console.
		expect(prompt).toContain("Run your setup code immediately");
		expect(prompt).toContain("Never wrap it in a DOMContentLoaded");
	});

	it("caps how many items a generated widget lists", () => {
		const prompt = buildEditorSystemPrompt(catalogue);

		expect(prompt).toContain("at most 12 items");
	});

	it("accepts a custom_code section large enough for a real widget", () => {
		const result = catalogueEditResponseSchema.safeParse({
			reply: "Added the game.",
			operations: [
				{
					op: "add_section",
					sectionType: "custom_code",
					code: `<div>${"x".repeat(9000)}</div>`,
				},
			],
		});

		expect(result.success).toBe(true);
	});
});
