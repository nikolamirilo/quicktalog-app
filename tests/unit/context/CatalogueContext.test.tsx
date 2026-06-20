// @vitest-environment happy-dom
import type { ContentBlock, Item } from "@quicktalog/common";
import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@clerk/nextjs", () => ({
	useUser: () => ({ user: null }),
}));

import {
	CatalogueContextProvider,
	useCatalogueContext,
} from "@/context/CatalogueContext";

afterEach(cleanup);

const category = (id: string): ContentBlock =>
	({
		id,
		order: 0,
		type: "category",
		name: id,
		layout: "variant_1",
		items: [],
		isExpanded: true,
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
