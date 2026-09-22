"use server";
import * as Sentry from "@sentry/nextjs";
import { after } from "next/server";
import { getVerifiedIdentity } from "@/lib/auth/identity";
import { AUTH_PROVIDER } from "@/lib/auth/provider";
import { getMyUserData } from "@/lib/users/my-user-data";
import { ensureUserRow, loadClerkProfile } from "@/lib/users/provision";
import { sendWelcomeEmailOnce } from "@/lib/users/welcome";

/** Profile, plan and usage of the signed-in user, or null when signed out. Identity comes from the session; RLS decides visibility. */
export async function getUserData() {
	try {
		const me = await getVerifiedIdentity();
		if (!me) return null;

		let result = await getMyUserData(me);
		if (
			!result.ok &&
			result.code === "not_found" &&
			AUTH_PROVIDER === "clerk"
		) {
			// user.created webhook hasn't arrived yet: provision now (admin work, outside the user tx).
			const profile = await loadClerkProfile(me.userId);
			if (profile) {
				await ensureUserRow(profile);
				result = await getMyUserData(me);
			}
		}
		if (!result.ok) {
			throw new Error(`Failed to fetch user data: ${result.code}`);
		}

		// No `user.created` webhook in Supabase Auth, so the welcome email is claimed
		// and sent here via `after`, off the response, so Resend can't hold up the load.
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
