// @vitest-environment happy-dom
import { DEFAULT_IMAGE } from "@quicktalog/common";
import {
	act,
	cleanup,
	fireEvent,
	render,
	screen,
	within,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ItemDetailModal } from "@/components/catalogue/modals/ItemDetailModal";
import type { ItemPrice } from "@/lib/catalogue/item-price";

afterEach(cleanup);

const PHOTO = "https://example.com/avocado-toast.jpg";

const renderModal = ({
	image = PHOTO,
	price = { amount: "9.50", currency: "€" },
	sectionName = "All day",
}: {
	image?: string;
	price?: ItemPrice | null;
	sectionName?: string;
} = {}) => {
	const onClose = vi.fn();
	render(
		<ItemDetailModal
			isOpen
			item={{
				name: "Avocado toast",
				description: "Sourdough and a poached egg.\nVegetarian.",
				image,
			}}
			onClose={onClose}
			price={price}
			sectionName={sectionName}
			theme="theme-monochrome"
		/>,
	);
	return { onClose, dialog: screen.getByRole("dialog") };
};

describe("ItemDetailModal", () => {
	it("shows the sale price, the list price, the percentage and the unit", () => {
		const { dialog } = renderModal({
			price: {
				amount: "7.60",
				currency: "€",
				unit: "portion",
				original: "9.50",
				percentOff: 20,
			},
		});
		expect(within(dialog).getByText("7.60 €")).toBeTruthy();
		expect(within(dialog).getByText("/ portion")).toBeTruthy();
		expect(within(dialog).getByText("−20%")).toBeTruthy();
		expect(dialog.textContent).toContain("Was 9.50 €");
	});

	it("leaves out the price when the item has none", () => {
		const { dialog } = renderModal({ price: null });
		expect(dialog.textContent).not.toMatch(/price/i);
		expect(
			within(dialog).getAllByRole("button", { name: "Close" }),
		).toHaveLength(2);
	});

	it("shows Free without a currency", () => {
		const { dialog } = renderModal({
			price: { amount: "Free", currency: "" },
		});
		expect(within(dialog).getByText("Free")).toBeTruthy();
	});

	it("shows the item's own photo and opens it full screen", async () => {
		const { dialog } = renderModal();
		expect(
			within(dialog).getByRole("img", { name: "Avocado toast" }),
		).toBeTruthy();
		await act(async () => {
			fireEvent.click(
				within(dialog).getByRole("button", { name: "Enlarge photo" }),
			);
		});
		expect(screen.getByRole("button", { name: "Close photo" })).toBeTruthy();
	});

	it("does not show the stock placeholder as a photo", () => {
		const { dialog } = renderModal({ image: DEFAULT_IMAGE });
		expect(within(dialog).queryByRole("img")).toBeNull();
		expect(
			within(dialog).queryByRole("button", { name: "Enlarge photo" }),
		).toBeNull();
	});

	it("names the section and the item", () => {
		const { dialog } = renderModal();
		expect(within(dialog).getByText("All day")).toBeTruthy();
		expect(
			within(dialog).getByRole("heading", { name: "Avocado toast" }),
		).toBeTruthy();
	});

	it("closes from the footer button", async () => {
		const { dialog, onClose } = renderModal();
		const buttons = within(dialog).getAllByRole("button", { name: "Close" });
		await act(async () => {
			fireEvent.click(buttons[buttons.length - 1]);
		});
		expect(onClose).toHaveBeenCalledTimes(1);
	});
});
