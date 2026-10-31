import "server-only";
import { schema } from "@quicktalog/common";
import { and, eq } from "drizzle-orm";
import { asAdmin } from "@/utils/db/admin";

const { catalogues, subscriptions, users } = schema;

/**
 * What still has to be settled elsewhere before the row disappears: the Paddle
 * subscriptions to cancel, the catalogue names whose cached pages have to go,
 * and the catalogue ids those pages' Redis drafts are keyed by.
 *
 * It is read while the row is still there, because every one of these is
 * reachable only through it: `subscriptions` hangs off `users.customer_id`, and
 * both cascade away with the row.
 */
export type UserFootprint = {
	activeSubscriptionIds: string[];
	catalogueNames: string[];
	catalogueIds: string[];
};

export async function loadUserFootprint(
	userId: string,
): Promise<UserFootprint> {
	return asAdmin("account:user-footprint", async (tx) => {
		const [user] = await tx
			.select({ customerId: users.customerId })
			.from(users)
			.where(eq(users.id, userId))
			.limit(1);

		const owned = await tx
			.select({ id: catalogues.id, name: catalogues.name })
			.from(catalogues)
			.where(eq(catalogues.userId, userId));

		if (!user?.customerId) {
			return {
				activeSubscriptionIds: [],
				catalogueNames: owned.map((row) => row.name),
				catalogueIds: owned.map((row) => row.id),
			};
		}

		const active = await tx
			.select({ subscriptionId: subscriptions.subscriptionId })
			.from(subscriptions)
			.where(
				and(
					eq(subscriptions.customerId, user.customerId),
					eq(subscriptions.subscriptionStatus, "active"),
				),
			);

		return {
			activeSubscriptionIds: active.map((row) => row.subscriptionId),
			catalogueNames: owned.map((row) => row.name),
			catalogueIds: owned.map((row) => row.id),
		};
	});
}
