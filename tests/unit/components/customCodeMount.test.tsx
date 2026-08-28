// @vitest-environment happy-dom
import CustomCodeBlockComponent from "@/components/catalogue/sections/CustomCode";
import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

const block = {
	id: "b1",
	order: 0,
	type: "custom_code" as const,
	name: "Spin the Wheel",
	code: '<div class="w"><canvas class="c"></canvas></div><script type="application/json" class="d">[1,2]</script><script>window.x=1;</script>',
};

describe("CustomCodeBlockComponent", () => {
	it("mounts the block markup itself rather than through React", async () => {
		// React must not own this subtree: re-applying `dangerouslySetInnerHTML` on
		// a later render tears out the live DOM a widget is drawing into, and the
		// restored <script> tags are inert, so the widget goes blank for good.
		const { container } = render(
			<CustomCodeBlockComponent block={block} mode="view" slug="s" />,
		);
		await new Promise((r) => setTimeout(r, 20));

		expect(container.querySelector(".w")).toBeTruthy();
		expect(container.querySelector("canvas.c")).toBeTruthy();
	});

	it("keeps the JSON data tag a widget reads its data from", async () => {
		const { container } = render(
			<CustomCodeBlockComponent block={block} mode="view" slug="s" />,
		);
		await new Promise((r) => setTimeout(r, 20));

		const data = container.querySelector("script.d");
		expect(data).toBeTruthy();
		expect(data?.textContent).toBe("[1,2]");
	});

	it("uses the block name as the section's accessible name", async () => {
		const { container } = render(
			<CustomCodeBlockComponent block={block} mode="view" slug="s" />,
		);

		expect(container.querySelector("section")?.getAttribute("aria-label")).toBe(
			"Spin the Wheel",
		);
	});
});
