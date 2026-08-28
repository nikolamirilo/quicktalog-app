import { applyCatalogueOperations } from "@/helpers/catalogueOperations";
import type { CatalogueOperation } from "@/types/ai";
import type { Catalogue, ContentBlock, Item } from "@quicktalog/common";
import { defaultCatalogueData } from "@quicktalog/common";
import { describe, expect, it } from "vitest";

const item = (id: string, name: string, order: number): Item => ({
	id,
	order,
	name,
	description: "",
	image: "",
	price: 5,
});

const catalogue = (content: ContentBlock[]): Catalogue =>
	({
		...defaultCatalogueData,
		id: "cat-1",
		name: "menu",
		content,
	}) as Catalogue;

const starters = (): ContentBlock => ({
	id: "sec-1",
	order: 0,
	type: "category",
	name: "Starters",
	layout: "variant_1",
	isExpanded: true,
	items: [item("it-1", "Bruschetta", 0), item("it-2", "Soup", 1)],
});

const mains = (): ContentBlock => ({
	id: "sec-2",
	order: 1,
	type: "container",
	name: "Mains",
	layout: "variant_1",
	items: [item("it-3", "Risotto", 0)],
});

const base = () => catalogue([starters(), mains()]);

describe("applyCatalogueOperations", () => {
	it("does not mutate the catalogue it is given", () => {
		const input = base();
		const snapshot = JSON.stringify(input);

		applyCatalogueOperations(input, [
			{ op: "delete_section", sectionId: "sec-1" },
		]);

		expect(JSON.stringify(input)).toBe(snapshot);
	});

	it("adds a section with items and reorders the content", () => {
		const result = applyCatalogueOperations(base(), [
			{
				op: "add_section",
				sectionType: "category",
				name: "Desserts",
				items: [{ name: "Tiramisu", price: 6 }],
			},
		]);

		const added = result.catalogue.content[2];
		expect(added.type).toBe("category");
		expect((added as any).name).toBe("Desserts");
		expect((added as any).items).toHaveLength(1);
		expect((added as any).items[0]).toMatchObject({
			name: "Tiramisu",
			price: 6,
		});
		expect((added as any).items[0].id).toBeTruthy();
		expect(result.catalogue.content.map((block) => block.order)).toEqual([
			0, 1, 2,
		]);
		expect(result.applied).toHaveLength(1);
	});

	it("resolves every operation against the original snapshot, not the running state", () => {
		// Deleting the first section shifts indices; id addressing must survive it.
		const operations: CatalogueOperation[] = [
			{ op: "delete_section", sectionId: "sec-1" },
			{ op: "update_section", sectionId: "sec-2", name: "Main courses" },
		];

		const result = applyCatalogueOperations(base(), operations);

		expect(result.catalogue.content).toHaveLength(1);
		expect((result.catalogue.content[0] as any).name).toBe("Main courses");
		expect(result.skipped).toHaveLength(0);
	});

	it("moves an item between sections and renumbers both", () => {
		const result = applyCatalogueOperations(base(), [
			{
				op: "move_item",
				sectionId: "sec-1",
				itemId: "it-1",
				toSectionId: "sec-2",
			},
		]);

		const [from, to] = result.catalogue.content as any[];
		expect(from.items.map((i: Item) => i.id)).toEqual(["it-2"]);
		expect(from.items.map((i: Item) => i.order)).toEqual([0]);
		expect(to.items.map((i: Item) => i.id)).toEqual(["it-3", "it-1"]);
		expect(to.items.map((i: Item) => i.order)).toEqual([0, 1]);
	});

	it("updates only the fields the operation names", () => {
		const result = applyCatalogueOperations(base(), [
			{ op: "update_item", sectionId: "sec-1", itemId: "it-2", price: 9.5 },
		]);

		const updated = (result.catalogue.content[0] as any).items[1];
		expect(updated).toMatchObject({ name: "Soup", price: 9.5 });
	});

	it("stores a resolved photo on new and existing items", () => {
		const result = applyCatalogueOperations(base(), [
			{
				op: "add_items",
				sectionId: "sec-2",
				items: [{ name: "Latte", image: "https://images/latte.jpg" }],
			},
			{
				op: "update_item",
				sectionId: "sec-1",
				itemId: "it-1",
				image: "https://images/bruschetta.jpg",
			},
		]);

		const [starters, mains] = result.catalogue.content as any[];
		expect(mains.items[1].image).toBe("https://images/latte.jpg");
		expect(starters.items[0].image).toBe("https://images/bruschetta.jpg");
		expect(result.applied[1]).toBe('Added a photo to "Bruschetta"');
	});

	it("skips operations that point at something that no longer exists", () => {
		const result = applyCatalogueOperations(base(), [
			{ op: "delete_item", sectionId: "sec-1", itemId: "missing" },
		]);

		expect(result.applied).toHaveLength(0);
		expect(result.skipped).toHaveLength(1);
		expect(result.limitReached).toBe(false);
	});

	it("trims added items to the remaining item allowance", () => {
		const result = applyCatalogueOperations(
			base(),
			[
				{
					op: "add_items",
					sectionId: "sec-2",
					items: [{ name: "A" }, { name: "B" }, { name: "C" }],
				},
			],
			{ items: 4 },
		);

		// 3 items already exist, so only one more fits.
		expect((result.catalogue.content[1] as any).items).toHaveLength(2);
		expect(result.limitReached).toBe(true);
	});

	it("creates embed and custom-code sections from the model's markup", () => {
		const result = applyCatalogueOperations(base(), [
			{
				op: "add_section",
				sectionType: "embedding",
				code: '<iframe src="https://maps.example/x"></iframe>',
			},
			{ op: "add_section", sectionType: "custom_code", code: "<b>hi</b>" },
		]);

		const [, , embed, custom] = result.catalogue.content as any[];
		expect(embed.type).toBe("embedding");
		expect(embed.code).toBe('<iframe src="https://maps.example/x"></iframe>');
		expect(custom.type).toBe("custom_code");
		expect(custom.code).toBe("<b>hi</b>");
		expect(result.skipped).toHaveLength(0);
	});

	it("stores the name on section types that render no heading", () => {
		const result = applyCatalogueOperations(base(), [
			{
				op: "add_section",
				sectionType: "custom_code",
				name: "Spin the wheel",
				code: "<div></div>",
			},
			{
				op: "add_section",
				sectionType: "text",
				name: "Intro",
				content: "<p>Hi</p>",
			},
		]);

		const [, , custom, text] = result.catalogue.content as any[];
		expect(custom.name).toBe("Spin the wheel");
		expect(text.name).toBe("Intro");
		// The summary now reports the real name rather than inventing one.
		expect(result.applied[0]).toBe(
			'Added custom_code section "Spin the wheel"',
		);
	});

	it("renames a section that renders no heading", () => {
		const withCode = catalogue([
			{
				id: "sec-9",
				order: 0,
				type: "custom_code",
				name: "Old",
				code: "<div/>",
			},
		]);

		const result = applyCatalogueOperations(withCode, [
			{ op: "update_section", sectionId: "sec-9", name: "New" },
		]);

		expect((result.catalogue.content[0] as any).name).toBe("New");
		expect(result.applied[0]).toBe('Renamed "Old" to "New"');
	});

	it("edits the markup of an existing embed section", () => {
		const withEmbed = catalogue([
			{ id: "sec-9", order: 0, type: "embedding", code: "<iframe/>" },
		]);

		const result = applyCatalogueOperations(withEmbed, [
			{ op: "update_section", sectionId: "sec-9", code: "<iframe src='new'/>" },
		]);

		expect((result.catalogue.content[0] as any).code).toBe(
			"<iframe src='new'/>",
		);
	});

	it("refuses section types the plan has not unlocked", () => {
		const result = applyCatalogueOperations(
			base(),
			[
				{ op: "add_section", sectionType: "custom_code", code: "<b>x</b>" },
				{ op: "add_section", sectionType: "embedding", code: "<iframe/>" },
				{ op: "add_section", sectionType: "category", name: "Desserts" },
			],
			{ sectionTypes: { divider: true, embedding: false, customCode: false } },
		);

		// Only the category survives; the two locked types are reported back.
		expect(result.catalogue.content).toHaveLength(3);
		expect((result.catalogue.content[2] as any).name).toBe("Desserts");
		expect(result.skipped).toEqual([
			"Custom code sections are not part of your plan.",
			"Embed sections are not part of your plan.",
		]);
		expect(result.limitReached).toBe(true);
	});

	it("refuses a new non-text section once the section allowance is spent", () => {
		const result = applyCatalogueOperations(
			base(),
			[{ op: "add_section", sectionType: "category", name: "Desserts" }],
			{ sections: 2 },
		);

		expect(result.catalogue.content).toHaveLength(2);
		expect(result.limitReached).toBe(true);
	});

	it("lets text sections through when the section allowance is spent", () => {
		const result = applyCatalogueOperations(
			base(),
			[{ op: "add_section", sectionType: "text", content: "<p>Hi</p>" }],
			{ sections: 2 },
		);

		expect(result.catalogue.content).toHaveLength(3);
		expect(result.limitReached).toBe(false);
	});

	it("merges catalogue and appearance patches without dropping siblings", () => {
		const result = applyCatalogueOperations(base(), [
			{
				op: "update_catalogue",
				fields: { currency: "USD", metadata: { title: "Menu" } },
			},
			{
				op: "update_appearance",
				fields: { theme: "theme-luxury", shadow: "high" },
			},
		]);

		expect(result.catalogue.currency).toBe("USD");
		expect(result.catalogue.metadata.title).toBe("Menu");
		expect(result.catalogue.metadata.icon).toBe(
			defaultCatalogueData.metadata.icon,
		);
		expect(result.catalogue.appearance.theme.name).toBe("theme-luxury");
		expect(result.catalogue.appearance.style.shadow).toBe("high");
		expect(result.catalogue.appearance.style.fontFamily).toBe(
			defaultCatalogueData.appearance.style.fontFamily,
		);
	});
});
