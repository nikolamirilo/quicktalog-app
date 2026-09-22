import "server-only";
import { schema } from "@quicktalog/common";
import { and, eq, isNull } from "drizzle-orm";
import type { Tx } from "@/utils/db";
import { verifyUserIdSig } from "@/lib/paddle/signature";

const users = schema.users;

export type PaddleCustomData = {
	user_id?: unknown;
	sig?: unknown;
} | null;

export type Resolution =
	| { userId: string }
	| { unresolved: "conflict" | "unlinked" };

/**
 * Decides which user an event belongs to, in this order:
 *
 * 1. the customer is linked, but signed custom data names a different user:
 *    unresolved `conflict` (Paddle reuses a customer when a known email is
 *    typed at checkout, which would otherwise credit the wrong account);
 * 2. the customer is linked and nothing contradicts it;
 * 3. the customer is unlinked and the signature is valid: link that user, but
 *    only while they have no customer of their own;
 * 4. otherwise unresolved `unlinked`, for a human to look at.
 */
export async function resolveUserId(
	tx: Tx,
	customData: PaddleCustomData,
	customerId: string,
): Promise<Resolution> {
	const signed = verifyUserIdSig(customData?.user_id, customData?.sig)
		? (customData?.user_id as string)
		: null;

	const [linked] = await tx
		.select({ id: users.id })
		.from(users)
		.where(eq(users.customerId, customerId))
		.limit(1);

	if (linked) {
		if (signed && signed !== linked.id) return { unresolved: "conflict" };
		return { userId: linked.id };
	}

	if (!signed) return { unresolved: "unlinked" };

	const [row] = await tx
		.update(users)
		.set({ customerId })
		.where(and(eq(users.id, signed), isNull(users.customerId)))
		.returning({ id: users.id });

	return row ? { userId: row.id } : { unresolved: "unlinked" };
}
