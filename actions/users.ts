"use server";
import * as Sentry from "@sentry/nextjs";
import { getVerifiedIdentity } from "@/lib/auth/identity";
import { getMyUserData } from "@/lib/users/my-user-data";
import { ensureUserRow, loadClerkProfile } from "@/lib/users/provision";

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
		return result.data;
	} catch (error) {
		Sentry.captureException(error, { tags: { op: "getUserData" } });
		console.error("Error in getUserData:", error);
		return null;
	}
}
