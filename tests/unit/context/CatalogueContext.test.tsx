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
		act(() => result.current!.removeBlock("B"));

		const content = result.current!.catalogue.content;
		expect(content.map((b) => b.id)).toEqual(["A", "C"]);
		expect(content.map((b) => b.order)).toEqual([0, 1]);
	});

	it("moves a block down and swaps order", () => {
		const { result } = setup();
		act(() => result.current!.addBlock(category("A")));
		act(() => result.current!.addBlock(category("B")));
		act(() => result.current!.addBlock(category("C")));
		act(() => result.current!.moveBlock("C", "up"));

		const content = result.current!.catalogue.content;
		expect(content.map((b) => b.id)).toEqual(["A", "C", "B"]);
		expect(content.map((b) => b.order)).toEqual([0, 1, 2]);
	});

	it("ignores a move that would go out of bounds", () => {
		const { result } = setup();
		act(() => result.current!.addBlock(category("A")));
		act(() => result.current!.addBlock(category("B")));
		act(() => result.current!.moveBlock("A", "up"));

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
		act(() => result.current!.addItem("Drinks", item("Cola")));
		act(() => result.current!.addItem("Drinks", item("Fanta")));

		const items = itemsAt(result.current!.catalogue.content[0]);
		expect(items.map((i) => i.id)).toEqual(["Cola", "Fanta"]);
		expect(items.map((i) => i.order)).toEqual([0, 1]);
	});

	it("removes an item and re-indexes order", () => {
		const { result } = setup();
		act(() => result.current!.addBlock(category("Drinks")));
		act(() => result.current!.addItem("Drinks", item("Cola")));
		act(() => result.current!.addItem("Drinks", item("Fanta")));
		act(() => result.current!.addItem("Drinks", item("Sprite")));
		act(() => result.current!.removeItem("Drinks", "Cola"));

		const items = itemsAt(result.current!.catalogue.content[0]);
		expect(items.map((i) => i.id)).toEqual(["Fanta", "Sprite"]);
		expect(items.map((i) => i.order)).toEqual([0, 1]);
	});

	it("moves an item within a block", () => {
		const { result } = setup();
		act(() => result.current!.addBlock(category("Drinks")));
		act(() => result.current!.addItem("Drinks", item("Cola")));
		act(() => result.current!.addItem("Drinks", item("Fanta")));
		act(() => result.current!.moveItem("Drinks", "Cola", "down"));

		const items = itemsAt(result.current!.catalogue.content[0]);
		expect(items.map((i) => i.id)).toEqual(["Fanta", "Cola"]);
		expect(items.map((i) => i.order)).toEqual([0, 1]);
	});

	it("moves an item from one block to another and re-indexes both", () => {
		const { result } = setup();
		act(() => result.current!.addBlock(category("Drinks")));
		act(() => result.current!.addBlock(category("Food")));
		act(() => result.current!.addItem("Drinks", item("Cola")));
		act(() => result.current!.addItem("Drinks", item("Fanta")));
		act(() => result.current!.moveItemToBlock("Drinks", "Cola", "Food"));

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
		act(() => hook.result.current?.addItem("drinks", item("mocha")));
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
		act(() => hook.result.current!.addItem("drinks", item("by-hand")));
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
		act(() => hook.result.current!.addItem("drinks", item("by-hand")));
		act(() => hook.result.current!.markSaved(sent));
		expect(hook.result.current!.isDirty).toBe(true);
	});
});

/**
 * The reported bug: an edit saved from a dialog landing on whatever now sits at
 * the position the dialog opened on. Every case here is a position that went
 * stale while the dialog was open - which is what the agent's edits do, live,
 * while the user works.
 */
describe("CatalogueContext edits address content by id", () => {
	const inserted = (hook: ReturnType<typeof setup>) =>
		act(() => hook.result.current!.addBlock(category("Inserted"), 0));

	it("renames the section the dialog opened on, not the one now in its place", () => {
		const hook = setup();
		act(() => hook.result.current!.addBlock(category("Coffee")));
		act(() => hook.result.current!.addBlock(category("Tea")));
		// The dialog opened on "Tea" at [1]; the agent then inserts a section at [0].
		inserted(hook);

		act(() => hook.result.current!.updateBlock("Tea", { name: "Teas" }));

		const content = hook.result.current!.catalogue.content;
		expect(content.map((block) => block.name)).toEqual([
			"Inserted",
			"Coffee",
			"Teas",
		]);
	});

	it("adds a section instead of overwriting one when the edit target is gone", () => {
		const hook = setup();
		act(() => hook.result.current!.addBlock(category("Coffee")));
		act(() => hook.result.current!.addBlock(category("Tea")));

		act(() => hook.result.current!.addBlock(category("New")));

		expect(hook.result.current!.catalogue.content.map((b) => b.id)).toEqual([
			"Coffee",
			"Tea",
			"New",
		]);
		expect(hook.result.current!.catalogue.content.map((b) => b.order)).toEqual([
			0, 1, 2,
		]);
	});

	it("saves an item into the section it was opened from", () => {
		const hook = setup();
		act(() => hook.result.current!.addBlock(category("Coffee")));
		act(() => hook.result.current!.addItem("Coffee", item("Latte")));
		inserted(hook);

		act(() =>
			hook.result.current!.updateItem("Coffee", "Latte", {
				...item("Latte"),
				name: "Flat white",
			}),
		);

		const content = hook.result.current!.catalogue.content;
		expect(itemsAt(content[0])).toEqual([]);
		expect(itemsAt(content[1]).map((entry) => entry.name)).toEqual([
			"Flat white",
		]);
	});

	it("adds an item to the section it was opened from", () => {
		const hook = setup();
		act(() => hook.result.current!.addBlock(category("Coffee")));
		inserted(hook);

		act(() => hook.result.current!.addItem("Coffee", item("Latte")));

		const content = hook.result.current!.catalogue.content;
		expect(itemsAt(content[0])).toEqual([]);
		expect(itemsAt(content[1]).map((entry) => entry.id)).toEqual(["Latte"]);
	});

	it("deletes, moves and reparents by id after the positions have shifted", () => {
		const hook = setup();
		act(() => hook.result.current!.addBlock(category("Coffee")));
		act(() => hook.result.current!.addBlock(category("Tea")));
		act(() => hook.result.current!.addItem("Coffee", item("Latte")));
		act(() => hook.result.current!.addItem("Coffee", item("Mocha")));
		inserted(hook);

		act(() => hook.result.current!.moveItem("Coffee", "Mocha", "up"));
		act(() => hook.result.current!.moveItemToBlock("Coffee", "Latte", "Tea"));
		act(() => hook.result.current!.moveBlock("Tea", "up"));
		act(() => hook.result.current!.removeBlock("Inserted"));

		const content = hook.result.current!.catalogue.content;
		expect(content.map((block) => block.id)).toEqual(["Tea", "Coffee"]);
		expect(itemsAt(content[0]).map((entry) => entry.id)).toEqual(["Latte"]);
		expect(itemsAt(content[1]).map((entry) => entry.id)).toEqual(["Mocha"]);
	});

	it("drops an edit whose section or item is no longer there", () => {
		const hook = setup();
		act(() => hook.result.current!.addBlock(category("Coffee")));
		act(() => hook.result.current!.addItem("Coffee", item("Latte")));
		const before = hook.result.current!.catalogue;

		act(() => hook.result.current!.updateBlock("Gone", { name: "x" }));
		act(() => hook.result.current!.removeBlock("Gone"));
		act(() => hook.result.current!.moveBlock("Gone", "up"));
		act(() => hook.result.current!.addItem("Gone", item("Tea")));
		act(() => hook.result.current!.updateItem("Coffee", "Gone", item("Tea")));
		act(() => hook.result.current!.removeItem("Coffee", "Gone"));
		act(() => hook.result.current!.moveItem("Coffee", "Gone", "down"));
		act(() => hook.result.current!.moveItemToBlock("Coffee", "Latte", "Gone"));

		// Nothing changed at all, so the draft is still the same object.
		expect(hook.result.current!.catalogue).toBe(before);
	});

	it("an item cannot be added to a section that does not hold items", () => {
		const hook = setup();
		act(() =>
			hook.result.current!.addBlock({
				id: "note",
				order: 0,
				type: "text",
				content: "<p>hi</p>",
			} as ContentBlock),
		);
		act(() => hook.result.current!.addItem("note", item("Latte")));

		expect(
			(hook.result.current!.catalogue.content[0] as { items?: unknown[] })
				.items,
		).toBeUndefined();
	});
});

describe("CatalogueContext has one writer", () => {
	it("keeps a hand edit made in the same tick as an agent edit", () => {
		const hook = setup();
		act(() => hook.result.current!.addBlock(category("drinks")));

		// Both land before React re-renders: the agent's edit used to be computed
		// from a draft that did not have the hand edit yet, and overwrote it.
		act(() => {
			hook.result.current!.updateCatalogue({ heading: "By hand" });
			hook.result.current!.applyAiOperations(
				[
					{
						op: "add_items",
						sectionId: "drinks",
						items: [{ id: "latte", name: "latte", price: 3 }],
					},
				],
				{},
			);
		});

		expect(hook.result.current!.catalogue.heading).toBe("By hand");
		expect(
			itemsAt(hook.result.current!.catalogue.content[0]).map((i) => i.id),
		).toEqual(["latte"]);
	});

	it("getCatalogue sees a hand edit straight away", () => {
		const hook = setup();
		let seen: string | undefined;
		act(() => {
			hook.result.current!.updateCatalogue({ heading: "Fresh" });
			seen = hook.result.current!.getCatalogue().heading;
		});
		expect(seen).toBe("Fresh");
	});
});
