"use server";
import { revalidatePath, revalidateTag } from "next/cache";

// Basic page revalidation - invalidates cache immediately, regenerates on next request
export async function revalidateData() {
	try {
		revalidatePath("/", "layout");
		return { success: true };
	} catch (error) {
		console.error("Failed to revalidate root layout:", error);
		return { success: false, error: error.message };
	}
}

// Revalidate specific catalogue - your main function
export async function revalidateCataloguesData(catalogueName: string) {
	try {
		console.log(`Attempting to revalidate: /catalogues/${catalogueName}`);

		// Revalidate the page path
		revalidatePath(`/catalogues/${catalogueName}`, "page");
		revalidateTag(`catalogue-${catalogueName}`);
		revalidateTag("catalogue-detail");
		revalidateTag("catalogues-list");

		console.log(`Successfully revalidated: /catalogues/${catalogueName}`);
		return { success: true };
	} catch (error) {
		console.error(`Failed to revalidate /catalogues/${catalogueName}:`, error);
		return { success: false, error: error.message };
	}
}

// Revalidate all catalogue-related pages
export async function revalidateAllCatalogues() {
	try {
		// Revalidate the catalogues listing page
		revalidatePath("/catalogues", "page");
		revalidateTag("catalogues-list");
		revalidatePath("/dashboard", "page");

		console.log("Successfully revalidated catalogue listings");
		return { success: true };
	} catch (error) {
		console.error("Failed to revalidate catalogue listings:", error);
		return { success: false, error: error.message };
	}
}

// Legacy function for backwards compatibility
export async function revalidatePageData(catalogueName: string) {
	return await revalidateCataloguesData(catalogueName);
}

// Using tags only - for more granular control
export async function revalidateCatalogueByTag(catalogueName: string) {
	try {
		console.log(`Attempting to revalidate tag: catalogue-${catalogueName}`);

		// Revalidate specific catalogue data
		revalidateTag(`catalogue-${catalogueName}`);

		// Revalidate catalogues list
		revalidateTag("catalogues-list");

		// Revalidate metadata
		revalidateTag("catalogue-metadata");

		// Revalidate detail pages
		revalidateTag("catalogue-detail");

		console.log(`Successfully revalidated tag: catalogue-${catalogueName}`);
		return { success: true };
	} catch (error) {
		console.error(
			`Failed to revalidate tag catalogue-${catalogueName}:`,
			error,
		);
		return { success: false, error: error.message };
	}
}

// Comprehensive revalidation after API changes
export async function revalidateAfterCatalogueChange(catalogueName?: string) {
	try {
		const revalidations = [];

		revalidations.push(revalidatePath("/catalogues", "page"));
		revalidations.push(Promise.resolve(revalidateTag("catalogues-list")));

		if (catalogueName) {
			revalidations.push(
				revalidatePath(`/catalogues/${catalogueName}`, "page"),
			);
			revalidations.push(
				Promise.resolve(revalidateTag(`catalogue-${catalogueName}`)),
			);
		}

		await Promise.all(revalidations);

		console.log("Successfully revalidated all catalogue-related pages");
		return { success: true };
	} catch (error) {
		console.error("Failed to revalidate after catalogue change:", error);
		return { success: false, error: error.message };
	}
}
