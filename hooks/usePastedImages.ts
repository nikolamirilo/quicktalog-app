"use client";
import { type RefObject, useEffect, useRef } from "react";

/**
 * Images arriving on the clipboard - a screenshot, a photo copied from a page.
 * Listens on the document, not the text field, since a paste before anything
 * has focus never reaches a React handler. `scope` decides whether the paste
 * was meant for it: inside it, or with nothing focused at all - so a paste
 * into some other field isn't swallowed while the panel happens to be open.
 */
export function usePastedImages(
	scope: RefObject<HTMLElement | null>,
	onImages: (files: File[]) => void,
): void {
	// Ref, not a dependency, so a fresh callback each render doesn't rebind the listener.
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

			// A rich-source copy carries image and text together; take the image but let the text land too.
			if (!event.clipboardData?.getData("text/plain")) event.preventDefault();

			handler.current(images);
		};

		document.addEventListener("paste", onPaste);
		return () => document.removeEventListener("paste", onPaste);
	}, [scope]);
}
