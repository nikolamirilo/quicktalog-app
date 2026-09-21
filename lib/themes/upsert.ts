import "server-only";
import * as Sentry from "@sentry/nextjs";
import { schema, type SavedTheme } from "@quicktalog/common";
import { and, eq } from "drizzle-orm";
import { sanitizeCustomThemeColors } from "@/helpers/theme";
import { drizzleClient } from "@/utils/drizzle";

const userThemes = schema.userThemes;

/**
 * Upserts one row in `user_themes` for `userId` under `name`. The save action
 * and the chat agent both call this so the two entry points stay in lockstep.
 * Takes the owner id, so it lives outside `"use server"`: only server code that
 * already verified the identity may call it.
 */
export async function upsertTheme(
	userId: string,
	name: string,
	colors: unknown,
): Promise<{ success: boolean; data?: SavedTheme; error?: string }> {
	try {
		const trimmedName = name.trim();
		if (!trimmedName) return { success: false, error: "Name is required" };

		const cleanColors = sanitizeCustomThemeColors(colors);

		const existing = await drizzleClient.query.userThemes.findFirst({
			where: and(
				eq(userThemes.userId, userId),
				eq(userThemes.name, trimmedName),
			),
			columns: { id: true },
		});

		const [saved] = existing
			? await drizzleClient
					.update(userThemes)
					.set({ colors: cleanColors, updatedAt: new Date().toISOString() })
					.where(
						and(eq(userThemes.id, existing.id), eq(userThemes.userId, userId)),
					)
					.returning()
			: await drizzleClient
					.insert(userThemes)
					.values({ userId, name: trimmedName, colors: cleanColors })
					.returning();

		if (!saved) return { success: false, error: "Unknown error" };
		return { success: true, data: saved as SavedTheme };
	} catch (err) {
		Sentry.captureException(err, { tags: { op: "upsertTheme" } });
		console.error("Unexpected error while saving theme:", err);
		return { success: false, error: "Unknown error" };
	}
}
