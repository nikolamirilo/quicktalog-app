"use server";
import * as Sentry from "@sentry/nextjs";
import { schema } from "@quicktalog/common";
import { eq, sql } from "drizzle-orm";
import { z } from "zod";
import { getVerifiedIdentity } from "@/lib/auth/identity";
import { pgError, withUser } from "@/utils/db";

const users = schema.users;

// Kept small: the column has a 2 KiB size check.
const preferencesSchema = z.object({
	accepted: z.boolean(),
	essential: z.boolean(),
	analytics: z.boolean(),
	marketing: z.boolean(),
	timestamp: z.string().max(40).optional(),
	version: z.union([z.string().max(20), z.number()]).optional(),
});

/**
 * Stores the signed-in user's cookie choices on their own row. Signed-out
 * visitors keep choices in localStorage only; this reports nothing stored.
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

// The database holds the only version that counts; this just keeps junk off the wire.
const versionSchema = z.string().min(1).max(64);

/**
 * Records the signed-in user's acceptance of all three legal documents, which
 * `private.record_consents` writes as one set with the version, the timestamp
 * and `source: 'gate'`.
 *
 * The version is passed in rather than read here on purpose: it is the one the
 * gate actually showed. `record_consents` refuses anything but the current
 * value (`22023`), so terms that change mid-session are reported back as stale
 * instead of being recorded as something the user never saw.
 */
export async function acceptLegalTerms(
	version: string,
): Promise<{ accepted: boolean; stale?: boolean }> {
	const parsed = versionSchema.safeParse(version);
	if (!parsed.success) return { accepted: false };

	const me = await getVerifiedIdentity();
	if (!me) return { accepted: false };

	try {
		await withUser(me, (tx) =>
			tx.execute(sql`select private.record_consents(${parsed.data})`),
		);
		return { accepted: true };
	} catch (err) {
		if (pgError(err)?.code === "22023") return { accepted: false, stale: true };
		Sentry.captureException(err, { tags: { op: "acceptLegalTerms" } });
		console.error("Unexpected error while recording consents:", err);
		return { accepted: false };
	}
}
