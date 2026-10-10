"use client";
import { useEffect, useState } from "react";

export interface VisualViewportBox {
	/** Distance from the top of the layout viewport to the visible area, in px. */
	top: number;
	/** Height of the visible area, in px. */
	height: number;
}

/**
 * The part of the page the user can actually see. On a phone it shrinks when
 * the on-screen keyboard opens, which a fixed `bottom-0` sheet does not notice
 * on iOS (the keyboard overlays the layout viewport instead of resizing it), so
 * a composer pinned to the bottom ends up under the keyboard.
 *
 * Only tracks while `active` and while `query` matches; returns null otherwise,
 * so callers fall back to their plain CSS layout.
 */
export function useVisualViewport(
	active: boolean,
	query: string,
): VisualViewportBox | null {
	const [box, setBox] = useState<VisualViewportBox | null>(null);

	useEffect(() => {
		const viewport = window.visualViewport;
		if (!active || !viewport) {
			setBox(null);
			return;
		}
		const media = window.matchMedia(query);

		const update = () => {
			if (!media.matches) {
				setBox(null);
				return;
			}
			setBox({ top: viewport.offsetTop, height: viewport.height });
		};

		update();
		viewport.addEventListener("resize", update);
		viewport.addEventListener("scroll", update);
		media.addEventListener("change", update);
		return () => {
			viewport.removeEventListener("resize", update);
			viewport.removeEventListener("scroll", update);
			media.removeEventListener("change", update);
		};
	}, [active, query]);

	return box;
}
