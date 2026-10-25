// @vitest-environment happy-dom
import type { ContentBlock, Item } from "@quicktalog/common";
import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import type { CatalogueOperation } from "@/types/ai";

import {
	CatalogueContextProvider,
	useCatalogueContext,
} from "@/context/CatalogueContext";

afterEach(cleanup);

const category = (id: string): ContentBlock =>
	({
		id,
		order: 0,
		type: "items",
		showHeading: true,
		isExpanded: true,
		name: id,
		layout: "variant_1",
		items: [],
	}) as ContentBlock;

const item = (id: string): Item =>
	({
		id,
		order: 0,
		name: id,
		description: "",
		image: "",
		price: 1,
	}) as Item;

const setup = () =>
	renderHook(() => useCatalogueContext(), {
		wrapper: CatalogueContextProvider,
	});

const itemsAt = (block: ContentBlock): Item[] =>
	(block as ContentBlock & { items: Item[] }).items;

describe("CatalogueContext block actions", () => {
	it("appends blocks and assigns sequential order", () => {
		const { result } = setup();
		act(() => result.current!.addBlock(category("A")));
		act(() => result.current!.addBlock(category("B")));

		const content = result.current!.catalogue.content;
		expect(content.map((b) => b.id)).toEqual(["A", "B"]);
		expect(content.map((b) => b.order)).toEqual([0, 1]);
	});

	it("inserts a block at a given index and re-indexes order", () => {
		const { result } = setup();
		act(() => result.current!.addBlock(category("A")));
		act(() => result.current!.addBlock(category("B")));
		act(() => result.current!.addBlock(category("C"), 1));

		const content = result.current!.catalogue.content;
		expect(content.map((b) => b.id)).toEqual(["A", "C", "B"]);
		expect(content.map((b) => b.order)).toEqual([0, 1, 2]);
	});

	it("removes a block and re-indexes the remaining order", () => {
		const { result } = setup();
		act(() => result.current!.addBlock(category("A")));
		act(() => result.current!.addBlock(category("B")));
		act(() => result.current!.addBlock(category("C")));
		act(() => result.current!.removeBlock(1));

		const content = result.current!.catalogue.content;
		expect(content.map((b) => b.id)).toEqual(["A", "C"]);
		expect(content.map((b) => b.order)).toEqual([0, 1]);
	});

	it("moves a block down and swaps order", () => {
		const { result } = setup();
		act(() => result.current!.addBlock(category("A")));
		act(() => result.current!.addBlock(category("B")));
		act(() => result.current!.addBlock(category("C")));
		act(() => result.current!.moveBlock(2, "up"));

		const content = result.current!.catalogue.content;
		expect(content.map((b) => b.id)).toEqual(["A", "C", "B"]);
		expect(content.map((b) => b.order)).toEqual([0, 1, 2]);
	});

	it("ignores a move that would go out of bounds", () => {
		const { result } = setup();
		act(() => result.current!.addBlock(category("A")));
		act(() => result.current!.addBlock(category("B")));
		act(() => result.current!.moveBlock(0, "up"));

		expect(result.current!.catalogue.content.map((b) => b.id)).toEqual([
			"A",
			"B",
		]);
	});
});

describe("CatalogueContext item actions", () => {
	it("adds items to a category block with sequential order", () => {
		const { result } = setup();
		act(() => result.current!.addBlock(category("Drinks")));
		act(() => result.current!.addItem(0, item("Cola")));
		act(() => result.current!.addItem(0, item("Fanta")));

		const items = itemsAt(result.current!.catalogue.content[0]);
		expect(items.map((i) => i.id)).toEqual(["Cola", "Fanta"]);
		expect(items.map((i) => i.order)).toEqual([0, 1]);
	});

	it("removes an item and re-indexes order", () => {
		const { result } = setup();
		act(() => result.current!.addBlock(category("Drinks")));
		act(() => result.current!.addItem(0, item("Cola")));
		act(() => result.current!.addItem(0, item("Fanta")));
		act(() => result.current!.addItem(0, item("Sprite")));
		act(() => result.current!.removeItem(0, 0));

		const items = itemsAt(result.current!.catalogue.content[0]);
		expect(items.map((i) => i.id)).toEqual(["Fanta", "Sprite"]);
		expect(items.map((i) => i.order)).toEqual([0, 1]);
	});

	it("moves an item within a block", () => {
		const { result } = setup();
		act(() => result.current!.addBlock(category("Drinks")));
		act(() => result.current!.addItem(0, item("Cola")));
		act(() => result.current!.addItem(0, item("Fanta")));
		act(() => result.current!.moveItem(0, 0, "down"));

		const items = itemsAt(result.current!.catalogue.content[0]);
		expect(items.map((i) => i.id)).toEqual(["Fanta", "Cola"]);
		expect(items.map((i) => i.order)).toEqual([0, 1]);
	});

	it("moves an item from one block to another and re-indexes both", () => {
		const { result } = setup();
		act(() => result.current!.addBlock(category("Drinks")));
		act(() => result.current!.addBlock(category("Food")));
		act(() => result.current!.addItem(0, item("Cola")));
		act(() => result.current!.addItem(0, item("Fanta")));
		act(() => result.current!.moveItemToBlock(0, 0, 1));

		const content = result.current!.catalogue.content;
		expect(itemsAt(content[0]).map((i) => i.id)).toEqual(["Fanta"]);
		expect(itemsAt(content[0]).map((i) => i.order)).toEqual([0]);
		expect(itemsAt(content[1]).map((i) => i.id)).toEqual(["Cola"]);
		expect(itemsAt(content[1]).map((i) => i.order)).toEqual([0]);
	});
});

describe("CatalogueContext AI review", () => {
	const addItemOp = (id: string): CatalogueOperation => ({
		op: "add_items",
		sectionId: "drinks",
		items: [{ id, name: id, price: 3 }],
	});

	const setupWithSection = () => {
		const hook = setup();
		act(() => hook.result.current?.addBlock(category("drinks")));
		return hook;
	};

	const itemIds = (hook: ReturnType<typeof setup>) =>
		itemsAt(hook.result.current?.catalogue.content[0] as ContentBlock).map(
			(entry) => entry.id,
		);

	it("applies AI edits straight away and holds them for review", () => {
		const hook = setupWithSection();
		act(() => {
			hook.result.current?.applyAiOperations([addItemOp("latte")], {});
		});
		expect(itemIds(hook)).toEqual(["latte"]);
		expect(hook.result.current?.aiReview?.changes).toHaveLength(1);
	});

	it("puts the catalogue back on reject, across several AI edits", () => {
		const hook = setupWithSection();
		act(() => {
			hook.result.current?.applyAiOperations([addItemOp("latte")], {});
		});
		act(() => {
			hook.result.current?.applyAiOperations([addItemOp("mocha")], {});
		});
		expect(hook.result.current?.aiReview?.changes).toHaveLength(2);
		act(() => hook.result.current?.rejectAiChanges());
		expect(itemIds(hook)).toEqual([]);
		expect(hook.result.current?.aiReview).toBeNull();
	});

	it("keeps the edits on accept", () => {
		const hook = setupWithSection();
		act(() => {
			hook.result.current?.applyAiOperations([addItemOp("latte")], {});
		});
		act(() => hook.result.current?.acceptAiChanges());
		expect(itemIds(hook)).toEqual(["latte"]);
		expect(hook.result.current?.aiReview).toBeNull();
	});

	it("treats a hand edit as keeping the AI edits", () => {
		const hook = setupWithSection();
		act(() => {
			hook.result.current?.applyAiOperations([addItemOp("latte")], {});
		});
		act(() => hook.result.current?.addItem(0, item("mocha")));
		expect(hook.result.current?.aiReview).toBeNull();
		expect(itemIds(hook)).toEqual(["latte", "mocha"]);
	});
});

describe("CatalogueContext replay within the plan", () => {
	const filled = (count: number): ContentBlock =>
		({
			...category("drinks"),
			items: Array.from({ length: count }, (_, i) => item(`d${i}`)),
		}) as ContentBlock;
	const addItems = (
		count: number,
		sectionId = "drinks",
	): CatalogueOperation => ({
		op: "add_items",
		sectionId,
		items: Array.from({ length: count }, (_, i) => ({
			id: `new-${sectionId}-${i}`,
			name: `New ${i}`,
			price: 1,
		})),
	});
	const basic = { items: 30, sections: 8 };
	const total = (hook: ReturnType<typeof setup>) =>
		hook.result.current!.catalogue.content.reduce(
			(n, block) => n + ((block as { items?: unknown[] }).items?.length ?? 0),
			0,
		);

	it("refuses the 31st item on Basic during replay", () => {
		const hook = setup();
		act(() => hook.result.current!.addBlock(filled(30)));
		let outcome: { applied: string[]; limitReached: boolean } | undefined;
		act(() => {
			outcome = hook.result.current!.applyAiOperations([addItems(5)], basic);
		});
		expect(outcome?.applied).toEqual([]);
		expect(outcome?.limitReached).toBe(true);
		expect(total(hook)).toBe(30);
	});

	it("skips later edits aimed at a section the replay refused", () => {
		const hook = setup();
		for (let i = 0; i < 8; i++) {
			act(() => hook.result.current!.addBlock(category(`s${i}`)));
		}
		act(() => {
			hook.result.current!.applyAiOperations(
				[
					{ op: "add_section", id: "S", sectionType: "items", name: "S" },
					addItems(3, "S"),
				],
				basic,
			);
		});
		const content = hook.result.current!.catalogue.content;
		expect(content).toHaveLength(8);
		expect(total(hook)).toBe(0);
	});

	it("a hand edit mid-turn cannot push the replay over", () => {
		const hook = setup();
		act(() => hook.result.current!.addBlock(filled(29)));
		act(() => hook.result.current!.addItem(0, item("by-hand")));
		act(() => {
			hook.result.current!.applyAiOperations([addItems(3)], basic);
		});
		expect(total(hook)).toBe(30);
	});

	it("getCatalogue returns the draft including edits applied in this pass", () => {
		const hook = setup();
		act(() => hook.result.current!.addBlock(filled(1)));
		let seen = 0;
		act(() => {
			hook.result.current!.applyAiOperations([addItems(2)], basic);
			const draft = hook.result.current!.getCatalogue();
			seen = (draft.content[0] as { items: unknown[] }).items.length;
		});
		expect(seen).toBe(3);
	});
});

describe("CatalogueContext unsaved changes", () => {
	const stored = () =>
		({ id: "cat-1", name: "menu", content: [category("drinks")] }) as never;
	const addOne: CatalogueOperation = {
		op: "add_items",
		sectionId: "drinks",
		items: [{ id: "latte", name: "latte", price: 3 }],
	};

	it("isDirty follows seeds, edits and saves", () => {
		const hook = setup();
		expect(hook.result.current!.isDirty).toBe(false);
		act(() => hook.result.current!.seedCatalogue(stored()));
		expect(hook.result.current!.isDirty).toBe(false);
		act(() => {
			hook.result.current!.applyAiOperations([addOne], {});
		});
		expect(hook.result.current!.isDirty).toBe(true);
		act(() => hook.result.current!.markSaved());
		expect(hook.result.current!.isDirty).toBe(false);
	});

	it("a change the server already made, like going live, stays saved", () => {
		const hook = setup();
		act(() => hook.result.current!.seedCatalogue(stored()));
		act(() => hook.result.current!.patchSaved({ status: "active" }));
		expect(hook.result.current!.catalogue.status).toBe("active");
		expect(hook.result.current!.isDirty).toBe(false);
	});

	it("is clean again after undoing AI edits back to the seed", () => {
		const hook = setup();
		act(() => hook.result.current!.seedCatalogue(stored()));
		act(() => {
			hook.result.current!.applyAiOperations([addOne], {});
		});
		act(() => hook.result.current!.rejectAiChanges());
		expect(hook.result.current!.isDirty).toBe(false);
	});

	it("an edit made while a save was running stays unsaved", () => {
		const hook = setup();
		act(() => hook.result.current!.seedCatalogue(stored()));
		act(() => {
			hook.result.current!.applyAiOperations([addOne], {});
		});
		const sent = hook.result.current!.getCatalogue();
		act(() => hook.result.current!.addItem(0, item("by-hand")));
		act(() => hook.result.current!.markSaved(sent));
		expect(hook.result.current!.isDirty).toBe(true);
	});
});
