import {
	asItemsBlock,
	isItemsBlock,
	normalizeBlock,
	normalizeContent,
} from "@/lib/catalogue/content-blocks";
import type { ContentBlock, ItemsBlock } from "@quicktalog/common";
import { describe, expect, it } from "vitest";

const legacyCategory = {
	id: "sec-1",
	order: 0,
	type: "category",
	name: "Drinks",
	layout: "variant_1",
	isExpanded: false,
	items: [{ id: "it-1", order: 0, name: "Espresso", price: 2.5 }],
} as unknown as ContentBlock;

const legacyContainer = {
	id: "sec-2",
	order: 1,
	type: "container",
	name: "Internal label",
	layout: "variant_3",
	items: [],
} as unknown as ContentBlock;

const text = {
	id: "sec-3",
	order: 2,
	type: "text",
	content: "<p>hi</p>",
} as ContentBlock;

describe("normalizeBlock", () => {
	it("turns a legacy category into an items block that still shows its heading", () => {
		const block = normalizeBlock(legacyCategory) as ItemsBlock;

		expect(block.type).toBe("items");
		expect(block.showHeading).toBe(true);
		expect(block.name).toBe("Drinks");
		// The stored collapse state has to survive, or every published category
		// silently springs open.
		expect(block.isExpanded).toBe(false);
		expect(block.layout).toBe("variant_1");
		expect(block.items).toHaveLength(1);
		expect(block.id).toBe("sec-1");
		expect(block.order).toBe(0);
	});

	it("keeps a legacy container's name hidden, because it never rendered one", () => {
		const block = normalizeBlock(legacyContainer) as ItemsBlock;

		expect(block.type).toBe("items");
		expect(block.showHeading).toBe(false);
		// Still carried: it labels the section in the builder's "move item" menu.
		expect(block.name).toBe("Internal label");
		expect(block.isExpanded).toBe(true);
	});

	it("defaults a category with no stored isExpanded to open", () => {
		const block = normalizeBlock({
			...(legacyCategory as any),
			isExpanded: undefined,
		}) as ItemsBlock;

		expect(block.isExpanded).toBe(true);
	});

	it("leaves an items block and every other type alone", () => {
		const items: ContentBlock = {
			id: "sec-4",
			order: 0,
			type: "items",
			name: "Mains",
			showHeading: false,
			isExpanded: true,
			layout: "variant_2",
			items: [],
		};

		expect(normalizeBlock(items)).toBe(items);
		expect(normalizeBlock(text)).toBe(text);
	});
});

describe("normalizeContent", () => {
	it("normalizes in place order and tolerates a missing array", () => {
		const result = normalizeContent([legacyContainer, text, legacyCategory]);

		expect(result.map((b) => b.type)).toEqual(["items", "text", "items"]);
		expect(normalizeContent(undefined)).toEqual([]);
		expect(normalizeContent(null)).toEqual([]);
	});
});

describe("isItemsBlock", () => {
	it("accepts the new key and both legacy keys, and nothing else", () => {
		expect(isItemsBlock(legacyCategory)).toBe(true);
		expect(isItemsBlock(legacyContainer)).toBe(true);
		expect(isItemsBlock({ type: "items" } as ContentBlock)).toBe(true);
		expect(isItemsBlock(text)).toBe(false);
		expect(isItemsBlock({ type: "divider" } as ContentBlock)).toBe(false);
	});
});

describe("asItemsBlock", () => {
	it("narrows and normalizes together, and returns null otherwise", () => {
		expect(asItemsBlock(legacyCategory)?.showHeading).toBe(true);
		expect(asItemsBlock(legacyContainer)?.showHeading).toBe(false);
		expect(asItemsBlock(text)).toBeNull();
	});
});
