"use client";
import { type RefObject, useEffect, useRef } from "react";

/**
 * Images arriving on the clipboard - a screenshot, a photo copied from a page.
 *
 * Listens on the document rather than on the text field, because a screenshot
 * is usually pasted the moment a panel opens, before anything inside it has
 * focus, and a paste with nothing focused never reaches a React handler. The
 * `scope` element decides whether the paste was meant for it: inside it, or
 * with nothing focused at all. That keeps a paste into some other field on the
 * page from being swallowed while the panel happens to be open, and the null
 * ref while the panel is closed means nothing is captured then either.
 */
export function usePastedImages(
	scope: RefObject<HTMLElement | null>,
	onImages: (files: File[]) => void,
): void {
	// Bound once for the component's life; reading the callback back off a ref
	// keeps a fresh function identity each render from rebinding the listener.
	const handler = useRef(onImages);
	handler.current = onImages;

	useEffect(() => {
		const onPaste = (event: ClipboardEvent) => {
			const root = scope.current;
			if (!root) return;

			const target = event.target as Node | null;
			const unfocused =
				!target ||
				target === document.body ||
				target === document.documentElement;
			if (!unfocused && target !== root && !root.contains(target)) return;

			const images = Array.from(event.clipboardData?.files ?? []).filter(
				(file) => file.type.startsWith("image/"),
			);
			if (images.length === 0) return;

			// Copying from a rich source puts an image and its text on the
			// clipboard together. Take the image, but let the text land in the
			// field as well rather than eating the half the user could see.
			if (!event.clipboardData?.getData("text/plain")) event.preventDefault();

			handler.current(images);
		};

		document.addEventListener("paste", onPaste);
		return () => document.removeEventListener("paste", onPaste);
	}, [scope]);
}
