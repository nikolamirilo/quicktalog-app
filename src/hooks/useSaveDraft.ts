"use client";
import { updateCatalogue } from "@/actions/catalogue";
import { useCatalogueContext } from "@/context/CatalogueContext";
import type { Catalogue } from "@quicktalog/common";

export type SaveDraftResult = { ok: boolean; error?: string };

/** Saves the builder draft if it has unsaved changes. The one save path for autosaves. */
export function useSaveDraft(): () => Promise<SaveDraftResult> {
	const context = useCatalogueContext();

	return async () => {
		if (!context?.isDirty) return { ok: true };
		const draft = context.getCatalogue();
		const result = await updateCatalogue(draft as Catalogue);
		if (!result.success) {
			return {
				ok: false,
				error: result.error ?? "Could not save your changes",
			};
		}
		// The object that was sent, so an edit made while saving stays unsaved.
		context.markSaved(draft);
		return { ok: true };
	};
}
