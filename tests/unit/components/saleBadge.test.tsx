// @vitest-environment happy-dom
import type { Item } from "@quicktalog/common";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import CardsSwitcher from "@/components/catalogue/cards";

afterEach(cleanup);

const ITEM: Item = {
	id: "item-cortado",
	order: 0,
	name: "Cortado",
	description: "Double shot cut with a splash of steamed milk.",
	price: 3.2,
	image: "https://example.com/cortado.jpg",
};

const renderCard = (variant: string, record: Partial<Item> = {}) =>
	render(
		<CardsSwitcher
			currency="EUR"
			i={0}
			record={{ ...ITEM, ...record }}
			variant={variant}
		/>,
	);

const pills = () => screen.queryAllByText(/^−\d+%$/);

describe("sale pill on item cards", () => {
	it("shows one pill with the percentage and a spoken label", () => {
		renderCard("variant_2", {
			discount: {
				isOnDiscount: true,
				discountedPrice: 2.4,
				discountPercentage: 25,
			},
		});
		expect(pills()).toHaveLength(1);
		expect(screen.getByText("25% off")).toBeTruthy();
	});

	it("works out the percentage when the saved one is missing", () => {
		renderCard("variant_2", {
			discount: {
				isOnDiscount: true,
				discountedPrice: 2.4,
				discountPercentage: 0,
			},
		});
		expect(screen.getByText("−25%")).toBeTruthy();
	});

	it("shows one pill on a card with no photo", () => {
		renderCard("variant_3", {
			discount: {
				isOnDiscount: true,
				discountedPrice: 2.4,
				discountPercentage: 25,
			},
		});
		expect(pills()).toHaveLength(1);
	});

	it("shows no pill while the sale price still equals the price", () => {
		renderCard("variant_2", {
			discount: {
				isOnDiscount: true,
				discountedPrice: 3.2,
				discountPercentage: 0,
			},
		});
		expect(pills()).toHaveLength(0);
	});

	it("shows no pill on an item that is not on sale", () => {
		renderCard("variant_2");
		expect(pills()).toHaveLength(0);
	});
});
