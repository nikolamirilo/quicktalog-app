"use server";
import * as Sentry from "@sentry/nextjs";
import { sql } from "drizzle-orm";
import { after } from "next/server";
import { ACQUISITION_SOURCE_MAX } from "@/constants/users";
import { getVerifiedIdentity } from "@/lib/auth/identity";
import { AUTH_PROVIDER } from "@/lib/auth/provider";
import { getMyUserData } from "@/lib/users/my-user-data";
import { ensureUserRow, loadClerkProfile } from "@/lib/users/provision";
import { sendWelcomeEmailOnce } from "@/lib/users/welcome";
import { withUser } from "@/utils/db";

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

/**
 * Records the signed-in user's answer to "how did you hear about us?": a slug
 * from `ACQUISITION_SOURCES`, their own words when they picked "Other", or
 * `ACQUISITION_SKIPPED`. The `is null` predicate makes the first answer final,
 * so a second call cannot overwrite it.
 */
export async function saveAcquisitionSource(source: string): Promise<boolean> {
	try {
		const me = await getVerifiedIdentity();
		if (!me) return false;

		const value = source.trim().slice(0, ACQUISITION_SOURCE_MAX);
		if (!value) return false;

		// Raw SQL until the next `drizzle-kit pull` release puts the column on
		// `schema.users`; the value is a bound parameter, and RLS still applies.
		const rows = await withUser(me, (tx) =>
			tx.execute<{ id: string }>(sql`
				update public.users
				   set acquisition_source = ${value}
				 where id = ${me.userId}
				   and acquisition_source is null
				returning id`),
		);
		return [...rows].length > 0;
	} catch (error) {
		Sentry.captureException(error, { tags: { op: "saveAcquisitionSource" } });
		console.error("Error saving acquisition source:", error);
		return false;
	}
}
