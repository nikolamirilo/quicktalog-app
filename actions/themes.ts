"use server";
import * as Sentry from "@sentry/nextjs";
import { schema, type SavedTheme } from "@quicktalog/common";
import { and, eq } from "drizzle-orm";
import { getVerifiedIdentity } from "@/lib/auth/identity";
import { upsertTheme } from "@/lib/themes/upsert";
import { drizzleClient } from "@/utils/drizzle";

const userThemes = schema.userThemes;

export async function listSavedThemes(): Promise<{
	success: boolean;
	data?: SavedTheme[];
	error?: string;
}> {
	try {
		const me = await getVerifiedIdentity();
		if (!me) return { success: false, error: "Unauthorized" };

		const data = await drizzleClient.query.userThemes.findMany({
			where: eq(userThemes.userId, me.userId),
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
	const me = await getVerifiedIdentity();
	if (!me) return { success: false, error: "Unauthorized" };
	return upsertTheme(me.userId, name, colors);
}

export async function deleteSavedTheme(
	id: string,
): Promise<{ success: boolean; error?: string }> {
	try {
		const me = await getVerifiedIdentity();
		if (!me) return { success: false, error: "Unauthorized" };

		const deleted = await drizzleClient
			.delete(userThemes)
			.where(and(eq(userThemes.id, id), eq(userThemes.userId, me.userId)))
			.returning({ id: userThemes.id });
		if (deleted.length === 0) return { success: false, error: "Not found" };

		return { success: true };
	} catch (err) {
		Sentry.captureException(err, { tags: { op: "deleteSavedTheme" } });
		console.error("Unexpected error while deleting theme:", err);
		return { success: false, error: "Unknown error" };
	}
}
