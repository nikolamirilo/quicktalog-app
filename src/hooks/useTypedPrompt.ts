"use client";

import { type RefObject, useCallback, useRef, useState } from "react";

import { useInView } from "@/hooks/useInView";
import { useReducedMotion } from "@/hooks/useReducedMotion";

/**
 * Which example prompt is shown and whether it is typed out. Typing starts
 * the first time `targetRef` is on screen (never with reduced motion) and
 * autoplays through `keys` until the visitor picks one.
 */
export function useTypedPrompt<K extends string>(
	keys: readonly K[],
	targetRef: RefObject<Element | null>,
) {
	const [active, setActive] = useState<K>(keys[0]);
	const autoplay = useRef(true);
	const reducedMotion = useReducedMotion();
	const inView = useInView(targetRef, { threshold: 0.3, once: true });

	const advance = useCallback(() => {
		if (!autoplay.current) return;
		setActive((key) => keys[(keys.indexOf(key) + 1) % keys.length]);
	}, [keys]);

	const choose = useCallback((key: K) => {
		autoplay.current = false;
		setActive(key);
	}, []);

	return { active, choose, advance, typing: inView && !reducedMotion };
}
