"use client";

import {
	createElement,
	type HTMLAttributes,
	type ReactNode,
	useEffect,
	useRef,
} from "react";

type RiseProps = HTMLAttributes<HTMLElement> & {
	as?: "div" | "article" | "section" | "li" | "aside";
	/** Milliseconds to wait before rising, for staggered groups. */
	delay?: number;
	children: ReactNode;
};

/**
 * Lifts its content 18px into place the first time it scrolls into view.
 * Transform only: the content is never hidden, so nothing depends on JS or the
 * animation finishing. Skipped when already on screen or with reduced motion.
 */
export function Rise({ as = "div", delay = 0, children, ...rest }: RiseProps) {
	const ref = useRef<HTMLElement>(null);

	useEffect(() => {
		const el = ref.current;
		if (!el || typeof IntersectionObserver === "undefined") return;
		if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
		if (el.getBoundingClientRect().top < window.innerHeight * 0.92) return;

		const observer = new IntersectionObserver(
			([entry]) => {
				if (!entry.isIntersecting) return;
				observer.disconnect();
				el.animate([{ transform: "translateY(18px)" }, { transform: "none" }], {
					delay,
					duration: 700,
					easing: "cubic-bezier(.2,.7,.2,1)",
					fill: "backwards",
				});
			},
			{ rootMargin: "0px 0px -8% 0px" },
		);
		observer.observe(el);
		return () => observer.disconnect();
	}, [delay]);

	return createElement(as, { ...rest, ref }, children);
}
