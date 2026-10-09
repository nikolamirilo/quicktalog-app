import type { Catalogue, ContentBlock, Item } from "@quicktalog/common";
import { describe, expect, it } from "vitest";
import { diffAiReview } from "@/lib/catalogue/ai-review";
import { normalizeContent } from "@/lib/catalogue/content-blocks";

const item = (id: string, name = id, order = 0): Item =>
	({ id, order, name, description: "", image: "", price: 1 }) as Item;

const section = (
	id: string,
	items: Item[],
	extra: Record<string, unknown> = {},
): ContentBlock =>
	({
		id,
		order: 0,
		type: "items",
		name: id,
		showHeading: true,
		isExpanded: true,
		layout: "variant_1",
		items,
		...extra,
	}) as ContentBlock;

const catalogueWith = (content: ContentBlock[]): Catalogue =>
	({ name: "cafe", content }) as Catalogue;

describe("diffAiReview", () => {
	it("finds added and edited items and sections, but not reordering", () => {
		const before = catalogueWith([
			section("drinks", [item("latte", "Latte", 0), item("mocha", "Mocha", 1)]),
		]);
		const after = catalogueWith([
			section("drinks", [
				item("mocha", "Mocha", 0),
				item("latte", "Latte with oat milk", 1),
			]),
			section("cakes", [item("brownie")]),
		]);
		expect(diffAiReview(before, after)).toEqual({
			sectionIds: ["cakes"],
			itemIds: ["latte", "brownie"],
		});
	});

	it("flags a section whose own settings changed", () => {
		const before = catalogueWith([section("drinks", [])]);
		const after = catalogueWith([
			section("drinks", [], { name: "Hot drinks" }),
		]);
		expect(diffAiReview(before, after).sectionIds).toEqual(["drinks"]);
	});

	it("doesn't count an item moved to another section as new", () => {
		const before = catalogueWith([
			section("drinks", [item("latte")]),
			section("cakes", []),
		]);
		const after = catalogueWith([
			section("drinks", []),
			section("cakes", [item("latte")]),
		]);
		expect(diffAiReview(before, after)).toEqual({
			sectionIds: [],
			itemIds: [],
		});
	});

	it("ignores the normalisation of a legacy category block", () => {
		const legacy = {
			id: "old",
			order: 0,
			type: "category",
			name: "Old",
			layout: "variant_1",
			items: [item("a")],
		} as unknown as ContentBlock;
		const before = catalogueWith([legacy]);
		const after = catalogueWith(normalizeContent([legacy]));
		expect(diffAiReview(before, after)).toEqual({
			sectionIds: [],
			itemIds: [],
		});
	});
});
