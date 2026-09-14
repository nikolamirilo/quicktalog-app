"use server";
import * as Sentry from "@sentry/nextjs";
import { currentUser } from "@clerk/nextjs/server";
import { schema, type SavedTheme } from "@quicktalog/common";
import { and, eq } from "drizzle-orm";
import { sanitizeCustomThemeColors } from "@/helpers/theme";
import { drizzleClient } from "@/utils/drizzle";

const userThemes = schema.userThemes;

export async function listSavedThemes(): Promise<{
	success: boolean;
	data?: SavedTheme[];
	error?: string;
}> {
	try {
		const user = await currentUser();
		if (!user?.id) return { success: false, error: "Unauthorized" };

		const data = await drizzleClient.query.userThemes.findMany({
			where: eq(userThemes.userId, user.id),
			orderBy: (themes, { desc }) => [desc(themes.updatedAt)],
		});

		return { success: true, data: data as SavedTheme[] };
	} catch (err) {
		Sentry.captureException(err, { tags: { op: "listSavedThemes" } });
		console.error("Unexpected error while listing saved themes:", err);
		return { success: false, error: "Unknown error" };
	}
}

export async function saveTheme(
	name: string,
	colors: unknown,
): Promise<{ success: boolean; data?: SavedTheme; error?: string }> {
	try {
		const user = await currentUser();
		if (!user?.id) return { success: false, error: "Unauthorized" };

		const trimmedName = name.trim();
		if (!trimmedName) return { success: false, error: "Name is required" };

		const cleanColors = sanitizeCustomThemeColors(colors);

		const existing = await drizzleClient.query.userThemes.findFirst({
			where: and(
				eq(userThemes.userId, user.id),
				eq(userThemes.name, trimmedName),
			),
			columns: { id: true },
		});

		const [saved] = existing
			? await drizzleClient
					.update(userThemes)
					.set({ colors: cleanColors, updatedAt: new Date().toISOString() })
					.where(eq(userThemes.id, existing.id))
					.returning()
			: await drizzleClient
					.insert(userThemes)
					.values({ userId: user.id, name: trimmedName, colors: cleanColors })
					.returning();

		return { success: true, data: saved as SavedTheme };
	} catch (err) {
		Sentry.captureException(err, { tags: { op: "saveTheme" } });
		console.error("Unexpected error while saving theme:", err);
		return { success: false, error: "Unknown error" };
	}
}

export async function deleteSavedTheme(
	id: string,
): Promise<{ success: boolean; error?: string }> {
	try {
		const user = await currentUser();
		if (!user?.id) return { success: false, error: "Unauthorized" };

		await drizzleClient
			.delete(userThemes)
			.where(and(eq(userThemes.id, id), eq(userThemes.userId, user.id)));

		return { success: true };
	} catch (err) {
		Sentry.captureException(err, { tags: { op: "deleteSavedTheme" } });
		console.error("Unexpected error while deleting theme:", err);
		return { success: false, error: "Unknown error" };
	}
}
