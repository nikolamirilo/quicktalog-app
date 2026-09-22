"use server";
import * as Sentry from "@sentry/nextjs";
import { schema } from "@quicktalog/common";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { getVerifiedIdentity } from "@/lib/auth/identity";
import { withUser } from "@/utils/db";

const users = schema.users;

// Kept small on purpose: the column has a 2 KiB size check, and anything the
// banner does not send has no business being stored.
const preferencesSchema = z.object({
	accepted: z.boolean(),
	essential: z.boolean(),
	analytics: z.boolean(),
	marketing: z.boolean(),
	timestamp: z.string().max(40).optional(),
	version: z.union([z.string().max(20), z.number()]).optional(),
});

/**
 * Stores the signed-in user's cookie choices on their own row. Consent used to
 * live in Clerk's public metadata, which the browser could read and which would
 * have been lost at the cutover.
 *
 * Visitors who are not signed in keep their choices in localStorage only; this
 * action simply reports that nothing was stored.
 */
export async function saveCookiePreferences(
	preferences: unknown,
): Promise<{ saved: boolean }> {
	const parsed = preferencesSchema.safeParse(preferences);
	if (!parsed.success) return { saved: false };

	const me = await getVerifiedIdentity();
	if (!me) return { saved: false };

	try {
		await withUser(me, (tx) =>
			tx
				.update(users)
				.set({ cookiePreferences: parsed.data })
				.where(eq(users.id, me.userId)),
		);
		return { saved: true };
	} catch (err) {
		// Best effort: a failed write must not block the banner from closing.
		Sentry.captureException(err, {
			level: "warning",
			tags: { op: "saveCookiePreferences" },
		});
		return { saved: false };
	}
}
