"use client";

import { useEffect, useState } from "react";

/** Whether a CSS media query matches; `false` during server render. */
export function useMediaQuery(query: string) {
	const [matches, setMatches] = useState(false);

	useEffect(() => {
		if (typeof window.matchMedia !== "function") return;
		const list = window.matchMedia(query);
		const update = () => setMatches(list.matches);
		update();
		list.addEventListener("change", update);
		return () => list.removeEventListener("change", update);
	}, [query]);

	return matches;
}
