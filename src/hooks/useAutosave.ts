"use client";
import type { Catalogue } from "@quicktalog/common";
import { useCallback, useEffect, useRef, useState } from "react";
import { updateCatalogue } from "@/actions/catalogue";
import { useCatalogueContext } from "@/context/CatalogueContext";

/** How long after the last edit the draft is written. */
export const AUTOSAVE_DEBOUNCE_MS = 1500;

/** Where the exit flush posts; a route handler, because a server action would be cancelled. */
const DRAFT_ENDPOINT = "/api/catalogue/draft";

/** Browsers refuse a `sendBeacon` or `keepalive` body over 64 KiB. */
const KEEPALIVE_LIMIT_BYTES = 60_000;

/** Backoff between retries of a failed save, capped at the last entry. */
const RETRY_MS = [1000, 2000, 4000, 8000, 15000, 30000];

export type SaveState =
	| "idle"
	| "pending"
	| "saving"
	| "saved"
	| "retrying"
	| "conflict";

export type AutosaveStatus = {
	state: SaveState;
	/** When the draft was last written, for "All changes saved" in the builder. */
	lastSavedAt: string | null;
	/** The draft differs from what visitors see. */
	unpublished: boolean;
	/** Someone saved this catalogue somewhere else; the builder offers a reload. */
	conflict: boolean;
	/**
	 * Saves now instead of waiting out the debounce, and says whether it landed.
	 * Used by Preview, Publish, Keep and the upgrade flow.
	 */
	flush: () => Promise<{ ok: boolean; error?: string }>;
	/** The draft was just published, so it is in step with the live catalogue again. */
	markPublished: () => void;
	/** A restored version became the draft: adopt its timestamp as the new base. */
	adoptSaved: (draftUpdatedAt: string | null) => void;
};

/**
 * Writes the builder's draft by itself, about `AUTOSAVE_DEBOUNCE_MS` after the owner
 * stops editing. There is no Save button any more, so this is the save path.
 *
 * Two things it deliberately does not do:
 *
 * - **It never saves while Quick AI's changes are under review.** Those are a proposal:
 *   the owner can still reject them, and a draft written in between would make Reject
 *   put back something that was already stored. Keep saves, through `useKeepAiChanges`.
 * - **It never writes the published catalogue.** Publish is still the only thing that
 *   changes what a visitor sees.
 *
 * The exit flush (tab hidden or closed) goes through `/api/catalogue/draft` rather than
 * the server action, because a server action started from `pagehide` is usually
 * cancelled along with the page. It is a safety net; the debounce above is the real
 * save path.
 */
export function useAutosave(initial: {
	draftUpdatedAt: string | null;
	unpublished: boolean;
}): AutosaveStatus {
	const context = useCatalogueContext();
	const catalogue = context?.catalogue;
	const isDirty = context?.isDirty ?? false;
	const underReview = Boolean(context?.aiReview);

	const [state, setState] = useState<SaveState>("idle");
	const [lastSavedAt, setLastSavedAt] = useState<string | null>(
		initial.draftUpdatedAt,
	);
	const [unpublished, setUnpublished] = useState(initial.unpublished);
	const [conflict, setConflict] = useState(false);

	/** The draft timestamp the server last confirmed; sent with every save. */
	const baseRef = useRef<string | null>(initial.draftUpdatedAt);
	const attemptRef = useRef(0);
	const inFlightRef = useRef(false);
	const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
	const contextRef = useRef(context);
	contextRef.current = context;
	const conflictRef = useRef(false);
	conflictRef.current = conflict;

	const clearTimer = useCallback(() => {
		clearTimeout(timerRef.current);
		timerRef.current = undefined;
	}, []);

	/** One attempt. `retry` asks the caller to come back to it later. */
	const save = useCallback(async (): Promise<{
		ok: boolean;
		retry?: boolean;
		error?: string;
	}> => {
		const ctx = contextRef.current;
		if (!ctx) return { ok: false, error: "The builder is not ready" };
		// Nothing to save, or a proposal still waiting for Keep. The review is read
		// through the context's ref: Keep clears it and saves in the same tick.
		if (!ctx.isDirty || ctx.getAiReview()) return { ok: true };
		if (conflictRef.current) {
			return { ok: false, error: "This catalogue was changed somewhere else." };
		}

		const draft = ctx.getCatalogue() as Catalogue;
		inFlightRef.current = true;
		setState("saving");
		try {
			const result = await updateCatalogue(draft, baseRef.current);
			if (result.conflict) {
				setConflict(true);
				setState("conflict");
				return { ok: false, error: result.error };
			}
			if (!result.success) {
				setState("retrying");
				return { ok: false, retry: true, error: result.error };
			}
			baseRef.current = result.draftUpdatedAt ?? baseRef.current;
			setLastSavedAt(result.draftUpdatedAt ?? null);
			setUnpublished(result.unpublished ?? true);
			// The object that was sent, so an edit made while saving stays unsaved.
			ctx.markSaved(draft);
			attemptRef.current = 0;
			setState("saved");
			return { ok: true };
		} catch {
			// Offline, or the action never reached the server.
			setState("retrying");
			return { ok: false, retry: true, error: "Could not save your changes" };
		} finally {
			inFlightRef.current = false;
		}
	}, []);

	// Self-rescheduling, so a failed save keeps trying and a save that lands while
	// another is in flight waits its turn instead of being dropped.
	const runRef = useRef<() => Promise<void>>(async () => {});
	runRef.current = async () => {
		clearTimer();
		if (inFlightRef.current) {
			timerRef.current = setTimeout(
				() => void runRef.current(),
				AUTOSAVE_DEBOUNCE_MS,
			);
			return;
		}
		const result = await save();
		if (!result.retry) return;
		const wait = RETRY_MS[Math.min(attemptRef.current, RETRY_MS.length - 1)];
		attemptRef.current += 1;
		timerRef.current = setTimeout(() => void runRef.current(), wait);
	};

	// The debounce. A new edit replaces the pending save rather than queueing one.
	useEffect(() => {
		if (!isDirty || underReview || conflict) {
			setState((current) =>
				current === "pending" || current === "retrying" ? "idle" : current,
			);
			return;
		}
		setState((current) => (current === "saving" ? current : "pending"));
		clearTimer();
		timerRef.current = setTimeout(
			() => void runRef.current(),
			AUTOSAVE_DEBOUNCE_MS,
		);
		return clearTimer;
		// `catalogue` is the draft's identity: every edit makes a new object.
	}, [catalogue, isDirty, underReview, conflict, clearTimer]);

	// Back online: try again at once rather than waiting out the backoff.
	useEffect(() => {
		const onOnline = () => {
			if (contextRef.current?.isDirty) void runRef.current();
		};
		window.addEventListener("online", onOnline);
		return () => window.removeEventListener("online", onOnline);
	}, []);

	// Leaving the page: send whatever is still unsaved, with a request that outlives
	// the document. `pagehide` covers closing the tab and leaving the site;
	// unmounting covers an in-app link, where neither event fires and the pending
	// debounce would simply be cleared away with the component.
	useEffect(() => {
		const flushOnExit = () => {
			const ctx = contextRef.current;
			// A proposal still waiting for Keep is not the owner's work yet.
			if (!ctx?.isDirty || ctx.getAiReview() || conflictRef.current) return;

			const body = JSON.stringify({
				catalogue: ctx.getCatalogue(),
				baseUpdatedAt: baseRef.current,
			});

			// `sendBeacon` is the one request browsers promise to finish after the
			// page is gone, so it goes first. Both it and `keepalive` cap the body at
			// 64 KiB, which a long catalogue passes - then the best that can be done
			// is an ordinary request that may or may not outlive the page. The
			// debounce above has almost always saved by now either way.
			const fits = body.length <= KEEPALIVE_LIMIT_BYTES;
			if (
				fits &&
				navigator.sendBeacon?.(
					DRAFT_ENDPOINT,
					new Blob([body], { type: "application/json" }),
				)
			) {
				return;
			}
			void fetch(DRAFT_ENDPOINT, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body,
				keepalive: fits,
			}).catch(() => {
				// The page is on its way out; there is nobody left to tell.
			});
		};

		const onVisibility = () => {
			if (document.visibilityState === "hidden") flushOnExit();
		};
		document.addEventListener("visibilitychange", onVisibility);
		window.addEventListener("pagehide", flushOnExit);
		return () => {
			document.removeEventListener("visibilitychange", onVisibility);
			window.removeEventListener("pagehide", flushOnExit);
			clearTimer();
			flushOnExit();
		};
	}, [clearTimer]);

	/**
	 * An explicit save: Preview, Publish, Keep and the upgrade flow all have to know
	 * the draft is stored before they go on, so this reports the outcome instead of
	 * leaving it to the background retry. A failure is still retried in the
	 * background, so the owner's work is not left behind either way.
	 */
	const flush = useCallback(async (): Promise<{
		ok: boolean;
		error?: string;
	}> => {
		clearTimer();
		// Let a save that is already on the wire finish; it carries the same draft.
		for (let wait = 0; inFlightRef.current && wait < 20; wait += 1) {
			await new Promise((resolve) => setTimeout(resolve, 100));
		}
		const result = await save();
		if (result.retry) {
			timerRef.current = setTimeout(() => void runRef.current(), RETRY_MS[0]);
		}
		return { ok: result.ok, error: result.error };
	}, [clearTimer, save]);

	const markPublished = useCallback(() => setUnpublished(false), []);

	const adoptSaved = useCallback((draftUpdatedAt: string | null) => {
		baseRef.current = draftUpdatedAt;
		setLastSavedAt(draftUpdatedAt);
		setUnpublished(true);
		setState("saved");
	}, []);

	return {
		state,
		lastSavedAt,
		unpublished,
		conflict,
		flush,
		markPublished,
		adoptSaved,
	};
}
