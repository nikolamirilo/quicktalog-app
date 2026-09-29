"use client";

import { useEffect, useState } from "react";

/**
 * The id of the section being read: the last of `ids` whose element has
 * scrolled to within `offset` px of the top of the viewport (below the fixed
 * navbar). Once the page is scrolled to the bottom, the last id wins, so short
 * closing sections that can never reach the top still become active.
 *
 * One scroll listener per call, throttled to an animation frame. Call it once
 * per page and share the result when several navs show the same position.
 */
export function useScrollSpy(ids: string[], offset = 120): string | undefined {
	const [activeId, setActiveId] = useState<string | undefined>(ids[0]);
	const key = ids.join("|");

	useEffect(() => {
		const list = key ? key.split("|") : [];
		if (!list.length) return;
		let frame = 0;
		const update = () => {
			frame = 0;
			const root = document.documentElement;
			const atBottom =
				window.innerHeight + window.scrollY >= root.scrollHeight - 2;
			let current = list[0];
			if (atBottom) {
				current = list[list.length - 1];
			} else {
				for (const id of list) {
					const node = document.getElementById(id);
					if (node && node.getBoundingClientRect().top <= offset) current = id;
				}
			}
			setActiveId(current);
		};
		const schedule = () => {
			if (!frame) frame = window.requestAnimationFrame(update);
		};
		update();
		window.addEventListener("scroll", schedule, { passive: true });
		window.addEventListener("resize", schedule);
		return () => {
			window.cancelAnimationFrame(frame);
			window.removeEventListener("scroll", schedule);
			window.removeEventListener("resize", schedule);
		};
	}, [key, offset]);

	return activeId;
}
