// @vitest-environment happy-dom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { SearchableSelect } from "@/components/ui/searchable-select";

afterEach(cleanup);

const options = [
	{ value: "EUR", label: "Euro", keywords: "EUR" },
	{ value: "GBP", label: "Pound sterling", keywords: "GBP" },
];

/** Radix selects need real pointer events, so only the closed state is covered. */
describe("SearchableSelect", () => {
	it("labels the trigger with the selected option", () => {
		render(
			<SearchableSelect
				onValueChange={vi.fn()}
				options={options}
				placeholder="Select currency"
				value="GBP"
			/>,
		);

		expect(screen.getByRole("combobox").textContent).toContain(
			"Pound sterling",
		);
	});

	it("shows the placeholder when nothing is selected", () => {
		render(
			<SearchableSelect
				onValueChange={vi.fn()}
				options={options}
				placeholder="Select currency"
			/>,
		);

		expect(screen.getByRole("combobox").textContent).toContain(
			"Select currency",
		);
	});
});
