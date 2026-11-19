import "server-only";
import { tiers } from "@quicktalog/common";
import * as Sentry from "@sentry/nextjs";
import { unstable_cache } from "next/cache";
import { getPaddleInstance } from "@/utils/paddle/get-paddle-instance";

/** Formatted totals by Paddle price id, the same shape the browser preview returns. */
export type ServerPrices = Record<string, string>;

/** Plan prices change about never; an hour is short enough to notice a change. */
const REVALIDATE_SECONDS = 3600;

/**
 * Prices rendered on the server are in USD, because there is no visitor to localise
 * for at build or cache time. The browser preview replaces them with the visitor's
 * own currency once Paddle.js answers.
 */
const SERVER_COUNTRY = "US";

const priceIds = () =>
	tiers.flatMap((tier) => [tier.priceId.month, tier.priceId.year]);

async function fetchPrices(): Promise<ServerPrices> {
	if (!process.env.PADDLE_API_KEY) return {};
	try {
		const preview = await getPaddleInstance().pricingPreview.preview({
			items: priceIds().map((priceId) => ({ priceId, quantity: 1 })),
			address: { countryCode: SERVER_COUNTRY },
		});
		const out: ServerPrices = {};
		for (const line of preview.details.lineItems) {
			out[line.price.id] = line.formattedTotals.total;
		}
		return out;
	} catch (err) {
		// A crawler seeing no price is the bug this fixes, but an outage must not
		// take the pricing page down with it: the browser preview still runs.
		Sentry.captureException(err, {
			level: "warning",
			tags: { op: "serverPaddlePrices" },
		});
		return {};
	}
}

/**
 * The plan prices, for rendering into the HTML itself.
 *
 * Until now prices existed only after Paddle.js had run in a browser, so a crawler, a
 * Slack or WhatsApp link preview and an AI search all saw "Price loading" where $5,
 * $12, $30 and $60 should be. Cached for an hour, so a page render is not a Paddle
 * round trip.
 */
export const getServerPrices = unstable_cache(fetchPrices, ["paddle-prices"], {
	revalidate: REVALIDATE_SECONDS,
	tags: ["paddle-prices"],
});
