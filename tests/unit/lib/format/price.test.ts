import { describe, expect, it } from "vitest";
import { formatPrice, getCurrencySymbol } from "@/lib/format/price";

describe("formatPrice", () => {
	it("strips the decimal portion when present", () => {
		expect(formatPrice("19.99")).toBe("19");
		expect(formatPrice("0.5")).toBe("0");
	});

	it("returns the value unchanged when there is no decimal", () => {
		expect(formatPrice("19")).toBe("19");
		expect(formatPrice("1000")).toBe("1000");
	});
});

describe("getCurrencySymbol", () => {
	it("maps currency codes to their symbol", () => {
		expect(getCurrencySymbol("USD")).toBe("$");
		expect(getCurrencySymbol("EUR")).toBe("€");
		expect(getCurrencySymbol("GBP")).toBe("£");
	});
});
