import {
	Paddle,
	PricePreviewParams,
	PricePreviewResponse,
} from "@paddle/paddle-js";
import { tiers } from "@quicktalog/common";
import * as Sentry from "@sentry/nextjs";
import { useEffect, useState } from "react";

export type PaddlePrices = Record<string, string>;

function getLineItems(): PricePreviewParams["items"] {
	const priceId = tiers.map((tier) => [tier.priceId.month, tier.priceId.year]);
	return priceId.flat().map((priceId) => ({ priceId, quantity: 1 }));
}

function getPriceAmounts(prices: PricePreviewResponse) {
	return prices.data.details.lineItems.reduce((acc, item) => {
		acc[item.price.id] = item.formattedTotals.total;
		return acc;
	}, {} as PaddlePrices);
}

export function usePaddlePrices(
	paddle: Paddle | undefined,
	country: string,
): { prices: PaddlePrices; loading: boolean } {
	const [prices, setPrices] = useState<PaddlePrices>({});
	const [loading, setLoading] = useState<boolean>(true);

	useEffect(() => {
		if (!paddle) return;

		const paddlePricePreviewRequest: Partial<PricePreviewParams> = {
			items: getLineItems(),
			...(country !== "OTHERS" && { address: { countryCode: country } }),
		};

		let cancelled = false;
		setLoading(true);

		(async () => {
			try {
				const response = await paddle.PricePreview(
					paddlePricePreviewRequest as PricePreviewParams,
				);
				if (cancelled) return;
				setPrices((prevState) => ({
					...prevState,
					...getPriceAmounts(response),
				}));
			} catch (err: any) {
				const isNetworkError =
					err?.error?.type === "network_error" ||
					err?.error?.code === "network_error";
				if (!isNetworkError)
					Sentry.captureException(err, {
						level: "warning",
						tags: { area: "paddle-pricing" },
					});
			} finally {
				if (!cancelled) setLoading(false);
			}
		})();

		return () => {
			cancelled = true;
		};
	}, [country, paddle]);
	return { prices, loading };
}
