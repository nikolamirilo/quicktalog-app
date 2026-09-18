import "server-only";
import { schema, tiers } from "@quicktalog/common";
import { eq } from "drizzle-orm";
import { defaultCookiePreferences } from "@/constants";
import { asAdmin } from "@/utils/db/admin";

const { users } = schema;

const DEFAULT_PLAN_ID = tiers[0].priceId.month;

export type ClerkProfile = {
	id: string;
	email: string | null;
	name: string;
	image: string | null;
	/** Only set when Clerk metadata actually holds a consent record. */
	cookiePreferences?: unknown;
};

/**
 * Creates or refreshes the users row from Clerk profile data (Clerk period only).
 * A new row gets the default plan; an existing row only has its email, name,
 * image and (when present) cookie preferences refreshed. Plan and Paddle
 * customer are never touched, so a redelivered webhook cannot downgrade anyone.
 */
export async function upsertClerkUser(profile: ClerkProfile): Promise<void> {
	await asAdmin("clerk:upsert-user", async (tx) => {
		const set: Record<string, unknown> = {
			email: profile.email,
			name: profile.name,
			image: profile.image,
		};
		if (profile.cookiePreferences !== undefined) {
			set.cookiePreferences = profile.cookiePreferences;
		}
		await tx
			.insert(users)
			.values({
				id: profile.id,
				email: profile.email,
				name: profile.name,
				image: profile.image,
				planId: DEFAULT_PLAN_ID,
				customerId: null,
				cookiePreferences:
					profile.cookiePreferences ?? defaultCookiePreferences,
			})
			.onConflictDoUpdate({ target: users.id, set });
	});
}

/**
 * Makes sure a signed-in Clerk user has a users row, covering the gap before the
 * `user.created` webhook arrives. Never changes an existing row.
 */
export async function ensureUserRow(profile: ClerkProfile): Promise<void> {
	await asAdmin("clerk:ensure-user", async (tx) => {
		await tx
			.insert(users)
			.values({
				id: profile.id,
				email: profile.email,
				name: profile.name,
				image: profile.image,
				planId: DEFAULT_PLAN_ID,
				customerId: null,
				cookiePreferences:
					profile.cookiePreferences ?? defaultCookiePreferences,
			})
			.onConflictDoNothing({ target: users.id });
	});
}

/** Deletes the users row; foreign keys cascade to the user's catalogues and usage. */
export async function deleteClerkUser(userId: string): Promise<number> {
	return asAdmin("clerk:delete-user", async (tx) => {
		const deleted = await tx
			.delete(users)
			.where(eq(users.id, userId))
			.returning({ id: users.id });
		return deleted.length;
	});
}

/** Loads a Clerk user's profile for ensureUserRow. */
export async function loadClerkProfile(
	userId: string,
): Promise<ClerkProfile | null> {
	const { clerkClient } = await import("@clerk/nextjs/server");
	const user = await (await clerkClient()).users.getUser(userId);
	if (!user) return null;
	const name = [user.firstName, user.lastName]
		.map((part) => part?.trim())
		.filter(Boolean)
		.join(" ");
	const consent = (user.publicMetadata as Record<string, unknown> | undefined)
		?.cookieConsent;
	return {
		id: user.id,
		email:
			user.primaryEmailAddress?.emailAddress?.trim().toLowerCase() ??
			user.emailAddresses?.[0]?.emailAddress?.trim().toLowerCase() ??
			null,
		name: name || "Unknown User",
		image: user.imageUrl?.trim() || null,
		cookiePreferences: consent ?? undefined,
	};
}
