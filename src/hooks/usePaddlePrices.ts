"use client";

import type {
	Paddle,
	PricePreviewParams,
	PricePreviewResponse,
} from "@paddle/paddle-js";
import { tiers } from "@quicktalog/common";
import * as Sentry from "@sentry/nextjs";
import { useEffect, useState } from "react";

export type PaddlePrices = Record<string, string>;

/** How long to wait for Paddle.js and the price preview before giving up. */
const PRICE_TIMEOUT_MS = 8000;

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

/**
 * Localised plan prices from Paddle. `loading` is true until a preview
 * settles; `unavailable` turns true when Paddle is blocked, fails, or has not
 * answered within a few seconds, so callers can stop showing a loading state.
 */
export function usePaddlePrices(
	paddle: Paddle | undefined,
	country: string,
): { prices: PaddlePrices; loading: boolean; unavailable: boolean } {
	const [prices, setPrices] = useState<PaddlePrices>({});
	const [loading, setLoading] = useState<boolean>(true);
	const [failed, setFailed] = useState(false);
	const [timedOut, setTimedOut] = useState(false);

	// Paddle.js may never load (ad blockers, offline); don't wait forever.
	useEffect(() => {
		const timer = setTimeout(() => setTimedOut(true), PRICE_TIMEOUT_MS);
		return () => clearTimeout(timer);
	}, []);

	useEffect(() => {
		if (!paddle) return;

		const paddlePricePreviewRequest: Partial<PricePreviewParams> = {
			items: getLineItems(),
			...(country !== "OTHERS" && { address: { countryCode: country } }),
		};

		let cancelled = false;
		setLoading(true);
		setFailed(false);

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
				if (!cancelled) setFailed(true);
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

	const hasPrices = Object.keys(prices).length > 0;
	return {
		prices,
		loading,
		unavailable: !hasPrices && (failed || (timedOut && loading)),
	};
}
