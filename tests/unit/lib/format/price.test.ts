import { describe, expect, it } from "vitest";
import {
	formatPrice,
	getCurrencySymbol,
	getYearlyNote,
	parsePrice,
} from "@/lib/format/price";

describe("formatPrice", () => {
	it("drops zero cents only", () => {
		expect(formatPrice("$19.00")).toBe("$19");
		expect(formatPrice("1,200.00")).toBe("1,200");
		expect(formatPrice("€12,00")).toBe("€12");
	});

	it("keeps non-zero cents", () => {
		expect(formatPrice("19.99")).toBe("19.99");
		expect(formatPrice("$0.50")).toBe("$0.50");
	});

	it("returns the value unchanged when there is no decimal", () => {
		expect(formatPrice("19")).toBe("19");
		expect(formatPrice("1,000")).toBe("1,000");
	});
});

describe("parsePrice", () => {
	it("splits a formatted price into symbol and amount", () => {
		expect(parsePrice("$1,200.50")).toEqual({ amount: 1200.5, symbol: "$" });
		expect(parsePrice(undefined)).toBeNull();
		expect(parsePrice("free")).toBeNull();
	});
});

describe("getYearlyNote", () => {
	it("keeps cents consistent with formatPrice", () => {
		expect(getYearlyNote("$12.00", "$120.00")).toBe(
			"Billed yearly · vs $144 paid monthly",
		);
		expect(getYearlyNote("$9.99", "$99.00")).toBe(
			"Billed yearly · vs $119.88 paid monthly",
		);
	});

	it("falls back when prices are missing", () => {
		expect(getYearlyNote(undefined, "$99.00")).toBe("Billed yearly");
	});
});

describe("getCurrencySymbol", () => {
	it("maps currency codes to their symbol", () => {
		expect(getCurrencySymbol("USD")).toBe("$");
		expect(getCurrencySymbol("EUR")).toBe("€");
		expect(getCurrencySymbol("GBP")).toBe("£");
	});
});
