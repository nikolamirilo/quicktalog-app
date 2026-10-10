"use client";

import { useMediaQuery } from "@/hooks/useMediaQuery";

/** Follows the visitor's `prefers-reduced-motion` setting. */
export function useReducedMotion() {
	return useMediaQuery("(prefers-reduced-motion: reduce)");
}
