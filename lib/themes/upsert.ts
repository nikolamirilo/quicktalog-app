import "server-only";
import * as Sentry from "@sentry/nextjs";
import { type SavedTheme, schema } from "@quicktalog/common";
import { and, eq } from "drizzle-orm";
import { sanitizeCustomThemeColors } from "@/helpers/theme";
import type { VerifiedIdentity } from "@/lib/auth/identity";
import { type Tx, withUser } from "@/utils/db";

const userThemes = schema.userThemes;

export type ThemeResult = {
	success: boolean;
	data?: SavedTheme;
	error?: string;
};

/**
 * Upserts one row in `user_themes` for `me` under `name`, in the caller's
 * transaction. One statement on the `(user_id, name)` unique key, so two saves
 * of the same name cannot race into a duplicate or lose one another's colours.
 *
 * `user_id` comes from the verified identity and is repeated in the SET
 * predicate, so the statement is owner-scoped on its own; the `user_themes_owner`
 * policy enforces the same thing again. `updated_at` is left to the
 * `user_themes_touch_updated_at` trigger.
 *
 * Errors are not caught here: a failed statement aborts the transaction, so the
 * `withUser` caller has to deal with it. Use `saveOwnTheme` for that.
 */
export async function upsertTheme(
	tx: Tx,
	me: VerifiedIdentity,
	name: string,
	colors: unknown,
): Promise<ThemeResult> {
	const trimmedName = name.trim();
	if (!trimmedName) return { success: false, error: "Name is required" };

	const cleanColors = sanitizeCustomThemeColors(colors);

	const [saved] = await tx
		.insert(userThemes)
		.values({ userId: me.userId, name: trimmedName, colors: cleanColors })
		.onConflictDoUpdate({
			target: [userThemes.userId, userThemes.name],
			set: { colors: cleanColors },
			setWhere: and(
				eq(userThemes.userId, me.userId),
				eq(userThemes.name, trimmedName),
			),
		})
		.returning();

	if (!saved) return { success: false, error: "Unknown error" };
	return { success: true, data: saved as SavedTheme };
}

/**
 * The whole save as one transaction. The save action and the chat agent both
 * call this, so the two entry points stay in lockstep. Takes a verified
 * identity, so it lives outside `"use server"`: only server code that already
 * checked who is asking may call it.
 */
export async function saveOwnTheme(
	me: VerifiedIdentity,
	name: string,
	colors: unknown,
): Promise<ThemeResult> {
	try {
		return await withUser(me, (tx) => upsertTheme(tx, me, name, colors));
	} catch (err) {
		Sentry.captureException(err, { tags: { op: "saveOwnTheme" } });
		console.error("Unexpected error while saving theme:", err);
		return { success: false, error: "Unknown error" };
	}
}
