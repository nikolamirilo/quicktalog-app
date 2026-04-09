"use server";
import { revalidatePath, revalidateTag } from "next/cache";

/**
 * Revalidate a specific catalogue and related listings.
 * Use after: create, update, publish, delete of a single catalogue.
 */
export async function revalidateCatalogue(catalogueName?: string) {
	revalidatePath("/catalogues", "page");
	revalidateTag("catalogues-list");

	if (catalogueName) {
		revalidatePath(`/catalogues/${catalogueName}`, "page");
		revalidateTag(`catalogue-${catalogueName}`);
		revalidateTag("catalogue-detail");
		revalidateTag("catalogue-metadata");
	}
}

/**
 * Revalidate the dashboard/admin area.
 * Use after: operations that affect dashboard stats (status changes, deletes, creates).
 */
export async function revalidateDashboard() {
	revalidatePath("/dashboard", "page");
	revalidatePath("/", "layout");
}
