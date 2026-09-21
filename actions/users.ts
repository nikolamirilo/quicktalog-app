"use server";
import { getVerifiedIdentity } from "@/lib/auth/identity";
import { fetchUserData } from "@/lib/users/fetchUserData";
import { ensureUserRow, loadClerkProfile } from "@/lib/users/provision";
import * as Sentry from "@sentry/nextjs";

/** Profile, plan and usage of the signed-in user, or null when signed out. */
export async function getUserData() {
	try {
		const me = await getVerifiedIdentity();
		if (!me) return null;

		let result = await fetchUserData({ userId: me.userId });
		if (!result.ok && result.code === "not_found") {
			// The user.created webhook has not arrived yet: create the row now.
			const profile = await loadClerkProfile(me.userId);
			if (profile) {
				await ensureUserRow(profile);
				result = await fetchUserData({ userId: me.userId });
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
