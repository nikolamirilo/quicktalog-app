import type { Item } from "@quicktalog/common";
import { describe, expect, it } from "vitest";
import { formatItemAmount, getItemPrice } from "@/lib/catalogue/item-price";

const priced = (over: Partial<Item>) =>
	({ price: 9.5, ...over }) as Pick<Item, "price" | "discount" | "denominator">;

describe("formatItemAmount", () => {
	it("drops cents only for whole amounts", () => {
		expect(formatItemAmount(10)).toBe("10");
		expect(formatItemAmount(9.5)).toBe("9.50");
		expect(formatItemAmount(1234.5)).toBe("1,234.50");
	});

	it("uses the catalogue's locale", () => {
		expect(formatItemAmount(9.5, "de-DE")).toBe("9,50");
	});
});

describe("getItemPrice", () => {
	it("returns null when the item has no price", () => {
		expect(
			getItemPrice(priced({ price: undefined as unknown as number }), "€"),
		).toBeNull();
		expect(
			getItemPrice(priced({ price: null as unknown as number }), "€"),
		).toBeNull();
	});

	it("shows a zero price as Free, with no currency or unit", () => {
		expect(getItemPrice(priced({ price: 0, denominator: "kg" }), "€")).toEqual({
			amount: "Free",
			currency: "",
		});
	});

	it("formats a regular price with its unit", () => {
		expect(getItemPrice(priced({ denominator: "portion" }), "€")).toEqual({
			amount: "9.50",
			currency: "€",
			unit: "portion",
		});
	});

	it("shows the sale price, the list price and the percentage off", () => {
		expect(
			getItemPrice(
				priced({
					denominator: "portion",
					discount: {
						isOnDiscount: true,
						discountPercentage: 20,
						discountedPrice: 7.6,
					},
				}),
				"€",
			),
		).toEqual({
			amount: "7.60",
			currency: "€",
			unit: "portion",
			original: "9.50",
			percentOff: 20,
		});
	});

	it("works out the percentage when it is missing", () => {
		expect(
			getItemPrice(
				priced({
					price: 10,
					discount: {
						isOnDiscount: true,
						discountPercentage: 0,
						discountedPrice: 7.5,
					},
				}),
				"€",
			)?.percentOff,
		).toBe(25);
	});

	it("ignores a discount that is off or not a real reduction", () => {
		const regular = { amount: "9.50", currency: "€", unit: undefined };
		for (const discount of [
			{ isOnDiscount: false, discountPercentage: 20, discountedPrice: 7.6 },
			{ isOnDiscount: true, discountPercentage: 0, discountedPrice: 0 },
			{ isOnDiscount: true, discountPercentage: 0, discountedPrice: 9.5 },
		]) {
			expect(getItemPrice(priced({ discount }), "€")).toEqual(regular);
		}
	});
});
