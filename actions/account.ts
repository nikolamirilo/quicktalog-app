"use server";
import * as Sentry from "@sentry/nextjs";
import { schema } from "@quicktalog/common";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { cancelSubscription } from "@/actions/paddle";
import { revalidateCatalogue, revalidateDashboard } from "@/helpers/server";
import {
	requireFreshUser,
	requireIdentity,
	UnauthorizedError,
} from "@/lib/auth/identity";
import { deleteDrafts } from "@/lib/catalogue/draft-cache";
import { withinRateLimit } from "@/lib/rate-limit";
import { loadUserFootprint } from "@/lib/users/provision";
import { withUser } from "@/utils/db";
import { authAdmin } from "@/utils/supabase/auth-admin";

const users = schema.users;

export type AccountResult = { success: boolean; error?: string };

/**
 * The display name, normalised before it is stored: the same string ends up in
 * the dashboard, in transactional email and in the CRM, so leading space,
 * runs of whitespace and control characters are removed rather than persisted.
 */
const nameSchema = z
	.string()
	.max(200)
	.transform((value) => value.replace(/\s+/g, " ").trim())
	.pipe(
		z
			.string()
			.min(1)
			.max(80)
			.regex(/^[^\x00-\x1f\x7f]+$/),
	);

/**
 * Renames the signed-in user. The id comes from the session, never from the
 * caller, and the write runs as `app_user`, which may set `name` and nothing
 * else on its own row.
 *
 * Rate limited to five changes an hour per user: a rename rewrites the row and
 * fires the CRM sync trigger, so an unbounded loop here is an outbound spam
 * pump. The limit fails closed, because it is the only bound there is.
 */
export async function updateProfile(name: string): Promise<AccountResult> {
	try {
		const me = await requireIdentity();

		const parsed = nameSchema.safeParse(name);
		if (!parsed.success) {
			return { success: false, error: "Enter a name of 1 to 80 characters." };
		}

		if (!(await withinRateLimit("profile", me.userId, { failOpen: false }))) {
			return {
				success: false,
				error: "Too many name changes. Try again in an hour.",
			};
		}

		const [row] = await withUser(me, (tx) =>
			tx
				.update(users)
				.set({ name: parsed.data })
				.where(eq(users.id, me.userId))
				.returning({ id: users.id }),
		);
		if (!row) return { success: false, error: "Account not found." };

		// Outside the transaction: revalidation must never hold a pooled
		// connection open.
		revalidateDashboard();
		return { success: true };
	} catch (err) {
		if (isUnauthorized(err)) return { success: false, error: "Not signed in." };
		Sentry.captureException(err, { tags: { op: "updateProfile" } });
		console.error("Unexpected error while updating the profile:", err);
		return { success: false, error: "Could not save your name." };
	}
}

/**
 * Deletes the signed-in user's account: their Paddle subscriptions, their
 * `auth.users` record, everything that hangs off it, and their cached drafts.
 *
 * The order is the whole point of this function, because the two systems cannot
 * be updated in one transaction:
 *
 * 1. `requireFreshUser()` rather than `requireIdentity()`. An access token stays
 *    valid for up to an hour after a ban or a sign-out everywhere, and this is
 *    not an operation to run for a token whose user may already be gone.
 * 2. Read the footprint while the row still exists. The subscriptions are
 *    reachable only through `users.customer_id` and the drafts only through the
 *    catalogue ids; step 4 takes both away.
 * 3. Cancel Paddle BEFORE anything is deleted, and abort the whole deletion if a
 *    cancellation fails. If the account went first, the customer link would be
 *    gone, nobody could find the subscription, and an account that no longer
 *    exists would keep being charged. A failure here leaves the user whole in
 *    both systems and they can try again; the only cost is a visible error.
 * 4. `deleteUser` is the single irreversible step, and it is also the only one
 *    that touches two systems at once: GoTrue's delete fires the `auth.users`
 *    delete trigger, which removes `public.users` in the same database
 *    transaction and cascades to catalogues, usage and subscriptions. There is
 *    therefore no state where the auth user is gone and the app row survives, or
 *    the other way round. The app never deletes `public.users` itself.
 * 5. Redis and revalidation come last and are best effort. They cannot be
 *    retried usefully (the account is already gone), and being stale is
 *    harmless: draft keys are catalogue ids, which are never reused, the keys
 *    expire on their own, and a public page 404s as soon as it re-renders. A
 *    failure is reported to Sentry, not to the caller.
 *
 * The one window that cannot be closed: if step 4 fails after step 3 succeeded,
 * the subscription is cancelled but the account still exists. That direction is
 * chosen deliberately — cancelled-but-alive is visible to the user and can be
 * fixed by subscribing again, deleted-but-still-charged is neither.
 *
 * No database transaction is open across the Paddle calls, the Redis delete or
 * the revalidations; each database read is its own short transaction.
 */
export async function deleteAccount(): Promise<AccountResult> {
	try {
		const me = await requireFreshUser();

		// The admin auth API only knows Supabase users. Under Clerk the account
		// UI lives in Clerk, and this action must do nothing at all.
		if (me.provider !== "supabase") {
			return {
				success: false,
				error: "Account deletion is not available for this account.",
			};
		}

		const footprint = await loadUserFootprint(me.userId);

		for (const subscriptionId of footprint.activeSubscriptionIds) {
			const result = await cancelSubscription(subscriptionId);
			if ("error" in result && result.error) {
				Sentry.captureException(
					new Error(
						`Account deletion aborted: could not cancel ${subscriptionId}: ${
							result.details ?? result.error
						}`,
					),
					{ tags: { op: "deleteAccount", step: "paddle" } },
				);
				return {
					success: false,
					error:
						"We could not cancel your subscription, so nothing was deleted. Please contact support.",
				};
			}
		}

		const { error } = await authAdmin().deleteUser(me.userId);
		if (error) {
			Sentry.captureException(error, {
				tags: { op: "deleteAccount", step: "auth" },
			});
			return {
				success: false,
				error: "We could not delete your account. Please contact support.",
			};
		}

		await deleteDrafts(footprint.catalogueIds).catch((err) =>
			Sentry.captureException(err, {
				level: "warning",
				tags: { op: "deleteAccount", step: "redis" },
			}),
		);
		for (const name of footprint.catalogueNames) revalidateCatalogue(name);
		revalidateCatalogue();
		revalidateDashboard();

		return { success: true };
	} catch (err) {
		if (isUnauthorized(err)) return { success: false, error: "Not signed in." };
		Sentry.captureException(err, { tags: { op: "deleteAccount" } });
		console.error("Unexpected error while deleting the account:", err);
		return {
			success: false,
			error: "We could not delete your account. Please try again.",
		};
	}
}

/**
 * A signed-out or stale caller is not an incident, so it is answered rather than
 * reported to Sentry. Not exported: a `"use server"` file exports actions only.
 */
function isUnauthorized(err: unknown): boolean {
	return err instanceof UnauthorizedError;
}
