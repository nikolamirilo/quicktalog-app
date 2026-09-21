"use server";
import * as Sentry from "@sentry/nextjs";
import { tiers } from "@quicktalog/common";
import { getVerifiedIdentity } from "@/lib/auth/identity";
import { ensurePaddleCustomer } from "@/lib/paddle/customer";
import { signUserId } from "@/lib/paddle/signature";
import { getPaddleInstance } from "@/utils/paddle/get-paddle-instance";

const KNOWN_PRICE_IDS = new Set(
	tiers.flatMap((tier) => Object.values(tier.priceId)),
);

/**
 * Starts a checkout for the signed-in user: a Paddle transaction pinned to
 * their customer, carrying their signed user id. The browser then opens
 * `Paddle.Checkout.open({ transactionId })`, so neither the price nor the buyer
 * can be swapped on the client.
 */
export async function createCheckout(
	priceId: string,
): Promise<{ transactionId: string } | { error: string }> {
	const me = await getVerifiedIdentity();
	if (!me) return { error: "Unauthorized" };
	if (!KNOWN_PRICE_IDS.has(priceId)) return { error: "Unknown plan" };

	try {
		const customerId = await ensurePaddleCustomer(me);
		const transaction = await getPaddleInstance().transactions.create({
			items: [{ priceId, quantity: 1 }],
			customerId,
			customData: { user_id: me.userId, sig: signUserId(me.userId) },
		});
		return { transactionId: transaction.id };
	} catch (err) {
		Sentry.captureException(err, { tags: { op: "createCheckout" } });
		console.error("Failed to create Paddle transaction:", err);
		return { error: "Could not start checkout" };
	}
}
