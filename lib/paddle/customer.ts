import "server-only";
import { schema } from "@quicktalog/common";
import { and, eq, isNull } from "drizzle-orm";
import type { VerifiedIdentity } from "@/lib/auth/identity";
import { withUser } from "@/utils/db";
import { asAdmin } from "@/utils/db/admin";
import { getPaddleInstance } from "@/utils/paddle/get-paddle-instance";

const users = schema.users;

/**
 * The Paddle customer for the signed-in user, created on first checkout and
 * stored in `users.customer_id`. Pinning the customer on the transaction stops
 * Paddle Checkout from attaching the purchase to somebody else's existing
 * customer when a different email is typed in the checkout form.
 *
 * The lookup runs as the user, so RLS answers for their own row only; the
 * Paddle calls happen with no transaction open. Storing the id is admin work:
 * `app_user` may not write `customer_id`, and the link has to survive whatever
 * the user does to their row afterwards.
 */
export async function ensurePaddleCustomer(
	me: VerifiedIdentity,
): Promise<string> {
	const [row] = await withUser(me, (tx) =>
		tx
			.select({ customerId: users.customerId, email: users.email })
			.from(users)
			.where(eq(users.id, me.userId))
			.limit(1),
	);

	if (!row) throw new Error("No user row for the signed-in user");
	if (row.customerId) return row.customerId;
	if (!row.email) throw new Error("User has no email for Paddle checkout");

	const email = row.email.trim().toLowerCase();
	const paddle = getPaddleInstance();

	let customerId: string | null = null;
	for await (const customer of paddle.customers.list({ email: [email] })) {
		customerId = customer.id;
		break;
	}
	if (!customerId) {
		customerId = (await paddle.customers.create({ email })).id;
	}

	// Only fill an empty customer_id: a concurrent checkout may have won.
	const [updated] = await asAdmin("paddle:link-checkout-customer", (tx) =>
		tx
			.update(users)
			.set({ customerId })
			.where(and(eq(users.id, me.userId), isNull(users.customerId)))
			.returning({ customerId: users.customerId }),
	);

	return updated?.customerId ?? customerId;
}
