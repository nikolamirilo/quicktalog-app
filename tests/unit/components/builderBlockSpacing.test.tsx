// @vitest-environment happy-dom
import { cleanup, render } from "@testing-library/react";
import type { DividerBlock, TextBlock } from "@quicktalog/common";
import { afterEach, describe, expect, it } from "vitest";
import BlockControls from "@/components/catalogue/cards/common/BlockControls";
import DividerBlockComponent from "@/components/catalogue/sections/DividerBlock";
import TextBlockComponent from "@/components/catalogue/sections/TextBlock";

afterEach(cleanup);

/**
 * Classes that move content: padding, margin, borders and sizes. Edit mode may
 * add colour, outlines and positioning, but anything here would push the block
 * away from where the published catalogue puts it.
 */
const LAYOUT_CLASS =
	/^(p|px|py|pt|pb|pl|pr|m|mx|my|mt|mb|ml|mr|w|h|min-h|max-h|min-w|max-w|gap|space|border)(-|$)/;

const layoutClasses = (el: Element) =>
	Array.from(el.classList)
		.filter((name) => LAYOUT_CLASS.test(name))
		.sort();

const textBlock: TextBlock = {
	id: "b1",
	order: 0,
	type: "text",
	name: "About",
	content: "<p>Des crêpes et pancakes faits maison.</p>",
};

const dividerBlock: DividerBlock = {
	id: "b2",
	order: 1,
	type: "divider",
	name: "Divider",
	spacing: 2,
};

const section = (container: HTMLElement) => {
	const el = container.querySelector("section");
	if (!el) throw new Error("block rendered no section");
	return el;
};

describe("builder block spacing", () => {
	it("gives a text block the same box in edit mode as in the catalogue", () => {
		const view = render(<TextBlockComponent block={textBlock} mode="view" />);
		const viewClasses = layoutClasses(section(view.container));
		cleanup();

		const edit = render(<TextBlockComponent block={textBlock} mode="edit" />);
		expect(layoutClasses(section(edit.container))).toEqual(viewClasses);
	});

	it("leaves a divider's box alone until it is edited", () => {
		const { container } = render(
			<DividerBlockComponent block={dividerBlock} mode="edit" />,
		);
		expect(layoutClasses(section(container))).toEqual([]);
	});

	it("floats the block row instead of reserving a row above the block", () => {
		const { container } = render(<BlockControls label="Text" />);
		const row = container.firstElementChild as HTMLElement;
		expect(row.className).toContain("absolute");
		// Its own gap is fine; anything that pushes the block is not.
		expect(layoutClasses(row).filter((name) => name !== "gap-2")).toEqual([]);
	});
});
