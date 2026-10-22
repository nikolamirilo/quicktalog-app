// @vitest-environment happy-dom
import {
	act,
	cleanup,
	fireEvent,
	render,
	screen,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ItemsBlockFields } from "@/components/catalogue/modals/content/ItemsBlockFields";

afterEach(cleanup);

const value = {
	name: "Breakfast",
	layout: "variant_1",
	showHeading: true,
	isExpanded: true,
};

const autoExpand = () => screen.getByRole("switch", { name: "Auto-expand" });

describe("ItemsBlockFields heading options", () => {
	it("lets Auto-expand be set while the heading is shown", () => {
		render(<ItemsBlockFields onChange={vi.fn()} value={value} />);
		expect(autoExpand().hasAttribute("disabled")).toBe(false);
		expect(autoExpand().getAttribute("aria-checked")).toBe("true");
	});

	it("disables Auto-expand and says why when the heading is off", () => {
		render(
			<ItemsBlockFields
				onChange={vi.fn()}
				value={{ ...value, showHeading: false }}
			/>,
		);
		expect(autoExpand().hasAttribute("disabled")).toBe(true);
		expect(autoExpand().getAttribute("aria-checked")).toBe("false");
		expect(screen.getByText("Turn on the heading first")).toBeTruthy();
	});

	it("turns the heading off from its switch", async () => {
		const onChange = vi.fn();
		render(<ItemsBlockFields onChange={onChange} value={value} />);
		await act(async () => {
			fireEvent.click(screen.getByRole("switch", { name: "Show heading" }));
		});
		expect(onChange).toHaveBeenCalledWith({ ...value, showHeading: false });
	});
});
