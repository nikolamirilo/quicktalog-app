import type { CategoryBlock, ContainerBlock, Item } from "@quicktalog/common";
import { describe, expect, it } from "vitest";
import {
	getDisplayItems,
	matchesQuery,
	normalizeSearch,
	normalizeText,
} from "@/lib/catalogue/items";

const item = (over: Partial<Item>): Item =>
	({
		id: over.id ?? "id",
		order: over.order ?? 0,
		name: over.name ?? "name",
		description: over.description ?? "",
		image: over.image ?? "",
		price: over.price ?? 0,
		...over,
	}) as Item;

const block = (items: Item[]): CategoryBlock =>
	({
		id: "b",
		order: 0,
		type: "category",
		name: "Block",
		layout: "variant_1",
		items,
		isExpanded: true,
	}) as CategoryBlock;

describe("normalizeSearch", () => {
	it("is off with an empty placeholder when missing", () => {
		expect(normalizeSearch(undefined)).toEqual({
			isEnabled: false,
			placeholder: "",
		});
	});

	it("keeps an enabled flag and caps the placeholder at 40 characters", () => {
		const out = normalizeSearch({
			isEnabled: true,
			placeholder: "x".repeat(60),
		});
		expect(out.isEnabled).toBe(true);
		expect(out.placeholder).toHaveLength(40);
	});

	it("only treats a literal true as enabled", () => {
		expect(normalizeSearch({ isEnabled: "yes" }).isEnabled).toBe(false);
	});
});

describe("normalizeText", () => {
	it("lowercases", () => {
		expect(normalizeText("HELLO")).toBe("hello");
	});

	it("strips diacritics so 'cafe' matches 'café'", () => {
		expect(normalizeText("Café")).toBe("cafe");
	});

	it("collapses whitespace runs", () => {
		expect(normalizeText("  a   b  ")).toBe("a b");
	});

	it("strips HTML tags from descriptions", () => {
		expect(normalizeText("<p>Hello <b>world</b></p>")).toBe("hello world");
	});

	it("returns empty string for null/undefined", () => {
		expect(normalizeText(null as unknown as string)).toBe("");
		expect(normalizeText(undefined as unknown as string)).toBe("");
	});
});

describe("matchesQuery", () => {
	it("matches on name (case-insensitive)", () => {
		expect(matchesQuery(item({ name: "Margherita Pizza" }), "pizza")).toBe(
			true,
		);
	});

	it("matches on description", () => {
		expect(
			matchesQuery(item({ description: "<p>fresh basil</p>" }), "basil"),
		).toBe(true);
	});

	it("requires every whitespace-separated term", () => {
		const i = item({ name: "Margherita Pizza", description: "tomato basil" });
		expect(matchesQuery(i, "pizza basil")).toBe(true);
		expect(matchesQuery(i, "pizza pineapple")).toBe(false);
	});

	it("ignores diacritics on both sides", () => {
		expect(matchesQuery(item({ name: "Café au lait" }), "cafe")).toBe(true);
		expect(matchesQuery(item({ name: "Cafe" }), "café")).toBe(true);
	});

	it("returns true for empty / whitespace-only queries (no filter)", () => {
		expect(matchesQuery(item({ name: "x" }), "")).toBe(true);
		expect(matchesQuery(item({ name: "x" }), "   ")).toBe(true);
	});
});

describe("getDisplayItems", () => {
	it("returns every item with its original index when query is empty", () => {
		const items = [
			item({ id: "a", name: "Apple" }),
			item({ id: "b", name: "Banana" }),
			item({ id: "c", name: "Cherry" }),
		];
		const result = getDisplayItems(block(items), "");
		expect(result).toEqual([
			{ item: items[0], originalIndex: 0 },
			{ item: items[1], originalIndex: 1 },
			{ item: items[2], originalIndex: 2 },
		]);
	});

	it("filters to matches and preserves each match's original index", () => {
		const items = [
			item({ id: "a", name: "Apple pie" }),
			item({ id: "b", name: "Banana bread" }),
			item({ id: "c", name: "Apple tart" }),
		];
		const result = getDisplayItems(block(items), "apple");
		expect(result).toEqual([
			{ item: items[0], originalIndex: 0 },
			{ item: items[2], originalIndex: 2 },
		]);
	});

	it("returns an empty array when the block has no items", () => {
		const b = block([]);
		expect(getDisplayItems(b, "")).toEqual([]);
		expect(getDisplayItems(b, "anything")).toEqual([]);
	});

	it("tolerates a missing items array", () => {
		const b = { ...block([]), items: undefined } as unknown as ContainerBlock;
		expect(getDisplayItems(b, "x")).toEqual([]);
	});
});
