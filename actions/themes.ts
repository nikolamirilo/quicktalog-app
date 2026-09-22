"use server";
import * as Sentry from "@sentry/nextjs";
import { getVerifiedIdentity } from "@/lib/auth/identity";
import { saveOwnTheme } from "@/lib/themes/upsert";
import { withUser } from "@/utils/db";
import { type SavedTheme, schema } from "@quicktalog/common";
import { and, desc, eq } from "drizzle-orm";

const userThemes = schema.userThemes;

export async function listSavedThemes(): Promise<{
	success: boolean;
	data?: SavedTheme[];
	error?: string;
}> {
	try {
		const me = await getVerifiedIdentity();
		if (!me) return { success: false, error: "Unauthorized" };

		const data = await withUser(me, (tx) =>
			tx
				.select()
				.from(userThemes)
				.where(eq(userThemes.userId, me.userId))
				.orderBy(desc(userThemes.updatedAt)),
		);

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
	return saveOwnTheme(me, name, colors);
}

export async function deleteSavedTheme(
	id: string,
): Promise<{ success: boolean; error?: string }> {
	try {
		const me = await getVerifiedIdentity();
		if (!me) return { success: false, error: "Unauthorized" };

		const deleted = await withUser(me, (tx) =>
			tx
				.delete(userThemes)
				.where(and(eq(userThemes.id, id), eq(userThemes.userId, me.userId)))
				.returning({ id: userThemes.id }),
		);
		if (deleted.length === 0) return { success: false, error: "Not found" };

		return { success: true };
	} catch (err) {
		Sentry.captureException(err, { tags: { op: "deleteSavedTheme" } });
		console.error("Unexpected error while deleting theme:", err);
		return { success: false, error: "Unknown error" };
	}
}
