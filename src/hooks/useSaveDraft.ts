"use client";
import { useBuilderStatus } from "@/context/BuilderStatusContext";

export type SaveDraftResult = { ok: boolean; error?: string };

/**
 * Writes the builder draft now, for the places that cannot wait out the autosave
 * debounce: Keep, and the upgrade flow that leaves the page.
 *
 * It goes through the builder's autosave rather than calling the action itself, so
 * there is one place holding the timestamp a save is made against. Two savers with two
 * timestamps would read as two devices editing and refuse each other.
 */
export function useSaveDraft(): () => Promise<SaveDraftResult> {
	const status = useBuilderStatus();

	return async () => {
		if (!status) return { ok: true };
		return status.flush();
	};
}
