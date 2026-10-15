import type { Item } from "@quicktalog/common";
import { DEFAULT_LOCALE } from "@/lib/catalogue/items";

/** An item's price ready to show: amounts are formatted, "Free" has no currency. */
export interface ItemPrice {
	amount: string;
	currency: string;
	unit?: string;
	/** The list price, set only while the item is on sale. */
	original?: string;
	percentOff?: number;
}

/** Whole amounts without cents ("10"), others with two decimals ("9.50"). */
export function formatItemAmount(value: number, locale = DEFAULT_LOCALE) {
	return value.toLocaleString(locale, {
		minimumFractionDigits: value % 1 === 0 ? 0 : 2,
		maximumFractionDigits: 2,
	});
}

/**
 * What a visitor pays for an item, or `null` when it has no price
 * (a service list or an "ask us" menu).
 */
export function getItemPrice(
	item: Pick<Item, "price" | "discount" | "denominator">,
	currency: string,
	locale = DEFAULT_LOCALE,
): ItemPrice | null {
	if (item.price === undefined || item.price === null) return null;

	const price = Number(item.price);
	if (price === 0) return { amount: "Free", currency: "" };

	const unit = item.denominator || undefined;
	const sale = item.discount?.isOnDiscount
		? Number(item.discount.discountedPrice)
		: Number.NaN;

	if (!(sale > 0 && sale < price)) {
		return { amount: formatItemAmount(price, locale), currency, unit };
	}

	return {
		amount: formatItemAmount(sale, locale),
		currency,
		unit,
		original: formatItemAmount(price, locale),
		percentOff:
			item.discount?.discountPercentage ||
			Math.round(((price - sale) / price) * 100),
	};
}
