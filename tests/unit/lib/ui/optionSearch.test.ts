import { describe, expect, it } from "vitest";

import { matchOptions } from "@/lib/ui/optionSearch";

const options = [
	{ value: "EUR", label: "Euro", keywords: "EUR" },
	{ value: "USD", label: "United States dollar", keywords: "USD" },
	{ value: "AUD", label: "Australian dollar", keywords: "AUD" },
	{ value: "GBP", label: "Pound sterling", keywords: "GBP" },
];

const labels = (query: string) =>
	matchOptions(options, query).map((option) => option.label);

describe("matchOptions", () => {
	it("sorts every option alphabetically when there is no query", () => {
		expect(labels("  ")).toEqual([
			"Australian dollar",
			"Euro",
			"Pound sterling",
			"United States dollar",
		]);
	});

	it("keeps only the options the query matches", () => {
		expect(labels("dollar")).toEqual([
			"Australian dollar",
			"United States dollar",
		]);
	});

	it("matches the keywords a currency code hides behind", () => {
		expect(labels("gbp")).toEqual(["Pound sterling"]);
	});

	it("puts a prefix match before a match in the middle", () => {
		expect(labels("united")).toEqual(["United States dollar"]);
		expect(labels("eur")[0]).toBe("Euro");
	});

	it("returns nothing when no option matches", () => {
		expect(labels("zzz")).toEqual([]);
	});
});
