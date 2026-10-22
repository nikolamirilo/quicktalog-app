import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";

function secret(): string {
	const value = process.env.PADDLE_CUSTOM_DATA_SECRET;
	if (!value) throw new Error("PADDLE_CUSTOM_DATA_SECRET is not set");
	return value;
}

/**
 * Signs the user id that travels through Paddle in `customData`. Paddle copies
 * custom data onto the subscription and its renewals, so the webhook can prove
 * the id came from our checkout instead of trusting whatever it is sent.
 */
export const signUserId = (userId: string) =>
	createHmac("sha256", secret()).update(`v1.${userId}`).digest("hex");

export function verifyUserIdSig(
	userId: unknown,
	sig: unknown,
): userId is string {
	if (typeof userId !== "string" || typeof sig !== "string") return false;
	if (userId.length === 0 || userId.length > 64) return false;
	const expected = Buffer.from(signUserId(userId));
	const provided = Buffer.from(sig);
	return (
		expected.length === provided.length && timingSafeEqual(expected, provided)
	);
}
