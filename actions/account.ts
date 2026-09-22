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

/** Display name, normalised before storage: no control chars, collapsed whitespace. */
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
 * Renames the signed-in user (id from the session, not the caller).
 * Rate limited: a rename fires the CRM sync trigger, so it must not be abusable.
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

		// Outside the transaction: revalidation must never hold a pooled connection.
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
 * Deletes the signed-in user: Paddle subscriptions, then `auth.users` (whose
 * delete trigger cascades `public.users`), then cached drafts. Paddle must be
 * cancelled first and the whole deletion aborts if that fails, or a deleted
 * account could keep being charged with no subscription left to find. Redis
 * and revalidation run last, best effort, since the account is already gone.
 * Uses `requireFreshUser`, not `requireIdentity`: a stale token can outlive a
 * ban or sign-out-everywhere by up to an hour.
 */
export async function deleteAccount(): Promise<AccountResult> {
	try {
		const me = await requireFreshUser();

		// Admin auth API only knows Supabase users; Clerk accounts manage this in Clerk.
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
		// No revalidateDashboard(): the user is gone, so there's no dashboard left to
		// refresh for them, and doing it here re-renders the still-mounted dashboard
		// page mid-delete with the now-deleted session, throwing a benign but noisy
		// not_found from getUserData.

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

/** A signed-out/stale caller is not an incident, so it's answered, not reported to Sentry. */
function isUnauthorized(err: unknown): boolean {
	return err instanceof UnauthorizedError;
}
