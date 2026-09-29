"use client";

import { useRef } from "react";

import { useInView } from "@/hooks/useInView";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { cn } from "@/lib/ui/cn";

/**
 * Rotating conic light behind the AI card's 1.5px frame. The square layer is
 * just big enough to cover the card while it turns (the card is tall on
 * phones, wide from `md`), and it only spins while on screen and when the
 * visitor has not asked for reduced motion.
 */
export function AiGlow() {
	const ref = useRef<HTMLDivElement>(null);
	const inView = useInView(ref);
	const reducedMotion = useReducedMotion();

	return (
		<div
			aria-hidden="true"
			className="absolute left-1/2 top-1/2 -z-10 aspect-square w-[320%] -translate-x-1/2 -translate-y-1/2 md:w-[150%]"
			ref={ref}
		>
			<div
				className={cn(
					"h-full w-full animate-[spin_7s_linear_infinite] bg-[conic-gradient(rgb(var(--product-primary-rgb)/0.08),rgb(var(--product-primary-rgb)/0.9)_12%,rgb(var(--product-primary-rgb)/0.08)_28%,rgb(var(--product-primary-rgb)/0.08)_60%,rgb(var(--product-primary-bright-rgb)/0.7)_72%,rgb(var(--product-primary-rgb)/0.08)_86%)]",
					(!inView || reducedMotion) && "[animation-play-state:paused]",
				)}
			/>
		</div>
	);
}
