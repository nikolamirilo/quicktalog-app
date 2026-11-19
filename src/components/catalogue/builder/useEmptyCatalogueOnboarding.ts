"use client";
import { useEffect, useRef } from "react";
import { useCatalogueContext } from "@/context/CatalogueContext";
import { captureEvent, PRODUCT_EVENTS } from "@/lib/analytics/events";
import {
	QUICK_AI_DESKTOP_MIN_WIDTH,
	QUICK_AI_HINT_KEY,
} from "@/lib/catalogue/onboarding";

/**
 * What a catalogue with nothing in it opens with.
 *
 * A new catalogue used to open on "+ Add Heading" and an empty box, with Quick AI as a
 * small pill in the corner - and Quick AI is what actually builds the first menu. So on
 * a desktop the chat opens with the first ask already written; on a phone it stays
 * closed, because the sheet would cover the catalogue the owner has just made, and the
 * Quick AI button is highlighted once instead.
 */
export function useEmptyCatalogueOnboarding(catalogueId: string | undefined) {
	const context = useCatalogueContext();
	const isEmpty = (context?.catalogue?.content?.length ?? 0) === 0;
	const setIsChatOpen = context?.setIsChatOpen;
	const setQuickAiHint = context?.setQuickAiHint;
	/** Once per catalogue: reopening the chat the owner closed would trap them. */
	const greeted = useRef<string | null>(null);
	const sectionCounted = useRef<string | null>(null);

	useEffect(() => {
		if (!catalogueId || !isEmpty) return;
		if (greeted.current === catalogueId) return;
		greeted.current = catalogueId;

		captureEvent(PRODUCT_EVENTS.builderOpenedEmpty, {
			catalogue_id: catalogueId,
		});

		if (window.innerWidth >= QUICK_AI_DESKTOP_MIN_WIDTH) {
			setIsChatOpen?.(true);
			return;
		}

		let seen = false;
		try {
			seen = window.localStorage.getItem(QUICK_AI_HINT_KEY) === "1";
		} catch {
			// Private mode or blocked storage: show it, rather than never.
		}
		if (!seen) setQuickAiHint?.(true);
	}, [catalogueId, isEmpty, setIsChatOpen, setQuickAiHint]);

	// The step from nothing to a first section, however it was made.
	useEffect(() => {
		if (!catalogueId || isEmpty) return;
		if (greeted.current !== catalogueId) return;
		if (sectionCounted.current === catalogueId) return;
		sectionCounted.current = catalogueId;
		captureEvent(PRODUCT_EVENTS.firstSectionCreated, {
			catalogue_id: catalogueId,
		});
	}, [catalogueId, isEmpty]);
}
