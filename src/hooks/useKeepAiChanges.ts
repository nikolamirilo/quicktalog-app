"use client";
import { useCatalogueContext } from "@/context/CatalogueContext";
import { type SaveDraftResult, useSaveDraft } from "@/hooks/useSaveDraft";

/** Keeps the AI edits under review and saves them, so work the user paid for is stored. */
export function useKeepAiChanges(): () => Promise<SaveDraftResult> {
	const context = useCatalogueContext();
	const save = useSaveDraft();

	return async () => {
		context?.acceptAiChanges();
		return save();
	};
}
