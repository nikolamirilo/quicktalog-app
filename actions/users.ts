"use server";
import * as Sentry from "@sentry/nextjs";
import { after } from "next/server";
import { getVerifiedIdentity } from "@/lib/auth/identity";
import { AUTH_PROVIDER } from "@/lib/auth/provider";
import { getMyUserData } from "@/lib/users/my-user-data";
import { ensureUserRow, loadClerkProfile } from "@/lib/users/provision";
import { sendWelcomeEmailOnce } from "@/lib/users/welcome";

/**
 * Profile, plan and usage of the signed-in user, or null when signed out.
 *
 * Takes no argument: the identity comes from the session, and `getMyUserData`
 * reads everything in one `app_user` transaction, so RLS decides what is
 * visible.
 */
export async function getUserData() {
	try {
		const me = await getVerifiedIdentity();
		if (!me) return null;

		let result = await getMyUserData(me);
		if (!result.ok && result.code === "not_found") {
			// The user.created webhook has not arrived yet: create the row now.
			// Provisioning is admin work and runs outside the user transaction.
			const profile = await loadClerkProfile(me.userId);
			if (profile) {
				await ensureUserRow(profile);
				result = await getMyUserData(me);
			}
		}
		if (!result.ok) {
			throw new Error(`Failed to fetch user data: ${result.code}`);
		}

		// Supabase Auth has no `user.created` webhook, so the welcome email is
		// claimed and sent here instead. `after` runs it once the response has
		// been flushed, so a new user's first dashboard load is not held up by
		// Resend; on every later load the claim matches no row and costs one
		// cheap statement.
		if (AUTH_PROVIDER === "supabase") {
			after(() => sendWelcomeEmailOnce(me));
		}

		return result.data;
	} catch (error) {
		Sentry.captureException(error, { tags: { op: "getUserData" } });
		console.error("Error in getUserData:", error);
		return null;
	}
}
