"use client";

import { type RefObject, useEffect, useState } from "react";

/**
 * True while the element is on screen. With `once`, it stays true after the
 * first time. Without IntersectionObserver it reports "in view" so nothing
 * that depends on it is stuck.
 */
export function useInView(
	ref: RefObject<Element | null>,
	{ threshold = 0, once = false }: { threshold?: number; once?: boolean } = {},
) {
	const [inView, setInView] = useState(false);

	useEffect(() => {
		const el = ref.current;
		if (!el) return;
		if (typeof IntersectionObserver === "undefined") {
			setInView(true);
			return;
		}
		const observer = new IntersectionObserver(
			([entry]) => {
				setInView(entry.isIntersecting);
				if (entry.isIntersecting && once) observer.disconnect();
			},
			{ threshold },
		);
		observer.observe(el);
		return () => observer.disconnect();
	}, [ref, threshold, once]);

	return inView;
}
