/**
 * Shortens a formatted price by dropping zero cents only: "$12.00" → "$12",
 * while "$12.99" stays "$12.99" (cents are never truncated).
 */
export function formatPrice(price: string) {
	return price.replace(/[.,]00(?!\d)/, "");
}

/** Reads a formatted price such as "$1,200.50" into its symbol and amount. */
export function parsePrice(price: string | undefined) {
	if (!price) return null;
	const amount = Number.parseFloat(price.replace(/[^\d.]/g, ""));
	if (Number.isNaN(amount)) return null;
	return { amount, symbol: price.replace(/[\d.,\s]/g, "") };
}

/** Formats an amount with a symbol the same way `formatPrice` shows Paddle prices. */
export function formatAmount(amount: number, symbol: string) {
	const value = amount.toLocaleString("en-US", {
		minimumFractionDigits: 2,
		maximumFractionDigits: 2,
	});
	return formatPrice(`${symbol}${value}`);
}

/** "Billed yearly · vs $144 paid monthly", or just "Billed yearly" when prices are not loaded. */
export function getYearlyNote(
	monthlyPrice: string | undefined,
	yearlyPrice: string | undefined,
) {
	const monthly = parsePrice(monthlyPrice);
	if (!monthly || !parsePrice(yearlyPrice)) return "Billed yearly";
	return `Billed yearly · vs ${formatAmount(monthly.amount * 12, monthly.symbol)} paid monthly`;
}

export function getCurrencySymbol(code: string, locale = "en-US") {
	return (0)
		.toLocaleString(locale, {
			style: "currency",
			currency: code,
			minimumFractionDigits: 0,
			maximumFractionDigits: 0,
		})
		.replace(/\d/g, "")
		.trim();
}
