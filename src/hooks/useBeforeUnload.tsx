"use client";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { InformModal } from "@/components/modals/InformModal";

/** Marks the one history entry the guard adds, in `history.state`. */
export const GUARD_STATE_KEY = "__qtNavigationGuard";

/** Where "Leave" goes after Back when this page was the first in the tab. */
const FALLBACK_DESTINATION = "/admin/dashboard";

const isGuardState = (state: unknown): boolean =>
	Boolean(
		state &&
			typeof state === "object" &&
			(state as Record<string, unknown>)[GUARD_STATE_KEY],
	);

/**
 * Where a click on `link` goes inside the app, or null when the browser should
 * handle it untouched: modified clicks and non-primary buttons, other targets
 * and downloads open elsewhere; other origins unload the page (the
 * `beforeunload` prompt covers them); a link to this same page only moves to a
 * fragment.
 */
export function inAppDestination(
	event: Pick<
		MouseEvent,
		| "button"
		| "metaKey"
		| "ctrlKey"
		| "shiftKey"
		| "altKey"
		| "defaultPrevented"
	>,
	link: HTMLAnchorElement,
	current: Pick<Location, "href" | "origin" | "pathname" | "search">,
): string | null {
	if (event.defaultPrevented || event.button !== 0) return null;
	if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
		return null;
	}
	const target = link.getAttribute("target");
	if (target && target !== "_self") return null;
	if (link.hasAttribute("download")) return null;
	let url: URL;
	try {
		url = new URL(link.getAttribute("href") ?? "", current.href);
	} catch {
		return null;
	}
	if (url.origin !== current.origin) return null;
	if (url.pathname === current.pathname && url.search === current.search) {
		return null;
	}
	return `${url.pathname}${url.search}${url.hash}`;
}

/**
 * Asks before leaving a page with unsaved changes.
 *
 * - Reload, tab close and links to other sites get the browser's own prompt.
 * - In-app links open the dialog; "Leave" continues with the Next router, so
 *   there is no full reload.
 * - Back: while dirty, one tagged entry for this same URL sits on top of the
 *   history. Pressing Back steps off it (the page stays), the guard puts it
 *   back and opens the dialog; "Leave" then goes back two entries, past both
 *   copies of this page, to where the user came from (or to the dashboard
 *   when the tab opened on this page). The tag means making
 *   the design dirty again never stacks a second entry.
 */
export function useNavigationGuard(isDirty: boolean, onLeave?: () => void) {
	const router = useRouter();
	const [isOpen, setIsOpen] = useState(false);
	const pending = useRef<(() => void) | null>(null);
	const leaving = useRef(false);
	const onLeaveRef = useRef(onLeave);
	onLeaveRef.current = onLeave;

	useEffect(() => {
		if (!isDirty || leaving.current) return;

		const guardUrl = window.location.href;
		const pushGuardEntry = () => {
			const state: unknown = window.history.state;
			if (isGuardState(state)) return;
			// Keep Next's own state so its router still recognises the entry.
			const base =
				state && typeof state === "object"
					? (state as Record<string, unknown>)
					: {};
			window.history.pushState(
				{ ...base, [GUARD_STATE_KEY]: true },
				"",
				guardUrl,
			);
		};
		pushGuardEntry();

		const onBeforeUnload = (e: BeforeUnloadEvent) => {
			if (leaving.current) return;
			e.preventDefault();
			// Older browsers need returnValue set to show the prompt.
			e.returnValue = "";
		};

		const onClick = (e: MouseEvent) => {
			if (leaving.current) return;
			const link = (e.target as Element | null)?.closest?.("a[href]");
			if (!(link instanceof HTMLAnchorElement)) return;
			const destination = inAppDestination(e, link, window.location);
			if (!destination) return;
			e.preventDefault();
			e.stopPropagation();
			pending.current = () => router.push(destination);
			setIsOpen(true);
		};

		const onPopState = (e: PopStateEvent) => {
			if (leaving.current || isGuardState(e.state)) return;
			// Jumped further than our own entry (e.g. the history menu): let it go.
			if (window.location.href !== guardUrl) return;
			pushGuardEntry();
			// The guard entry is now the last one, so `length` is its position.
			// With nothing before this page in the tab, go to the dashboard.
			pending.current =
				window.history.length > 2
					? () => window.history.go(-2)
					: () => router.push(FALLBACK_DESTINATION);
			setIsOpen(true);
		};

		window.addEventListener("beforeunload", onBeforeUnload);
		document.addEventListener("click", onClick, true);
		window.addEventListener("popstate", onPopState);
		return () => {
			window.removeEventListener("beforeunload", onBeforeUnload);
			document.removeEventListener("click", onClick, true);
			window.removeEventListener("popstate", onPopState);
		};
	}, [isDirty, router]);

	const confirm = useCallback(() => {
		setIsOpen(false);
		leaving.current = true;
		onLeaveRef.current?.();
		const navigate = pending.current;
		pending.current = null;
		navigate?.();
	}, []);

	const cancel = useCallback(() => {
		setIsOpen(false);
		pending.current = null;
	}, []);

	return { isOpen, confirm, cancel };
}

/** The unsaved-changes dialog, wired to `useNavigationGuard`. */
export function NavigationGuard({
	isDirty,
	onLeave,
}: {
	isDirty: boolean;
	/** Called when the user chooses to leave, before navigating. */
	onLeave?: () => void;
}) {
	const { isOpen, confirm, cancel } = useNavigationGuard(isDirty, onLeave);
	return (
		<InformModal
			cancelText="Stay"
			confirmText="Leave"
			isOpen={isOpen}
			message="You have unsaved changes. Are you sure you want to leave?"
			onCancel={cancel}
			onConfirm={confirm}
			title="Unsaved Changes"
		/>
	);
}
