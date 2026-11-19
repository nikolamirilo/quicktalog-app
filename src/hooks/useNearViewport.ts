"use client";

import { type RefObject, useEffect, useState } from "react";

/** Starts work a little before the element is on screen. */
const DEFAULT_ROOT_MARGIN = "400px";

/**
 * True once `ref` has come within `rootMargin` of the viewport, and true from
 * then on - this gates work that should start as a section approaches, not
 * work that should stop when it leaves.
 *
 * Returns true immediately where `IntersectionObserver` is missing, so the
 * gated work still happens.
 */
export function useNearViewport(
	ref: RefObject<HTMLElement | null>,
	rootMargin: string = DEFAULT_ROOT_MARGIN,
) {
	const [near, setNear] = useState(false);

	useEffect(() => {
		if (near) return;
		const element = ref.current;
		if (!element) return;
		if (typeof IntersectionObserver === "undefined") {
			setNear(true);
			return;
		}

		const observer = new IntersectionObserver(
			([entry]) => {
				if (entry?.isIntersecting) setNear(true);
			},
			{ rootMargin },
		);
		observer.observe(element);
		return () => observer.disconnect();
	}, [near, ref, rootMargin]);

	return near;
}
