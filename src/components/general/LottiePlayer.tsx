"use client";

import type { AnimationItem } from "lottie-web";
import { type ReactNode, useEffect, useRef, useState } from "react";

import { cn } from "@/lib/ui/cn";

export type LottieAnimation =
	| "ai-build"
	| "growth"
	| "idea-live"
	| "qr-scan"
	| "sparkle";

type LottiePlayerProps = {
	animation: LottieAnimation;
	/** Frame shown instead of playing when the visitor prefers reduced motion. */
	restFrame: number;
	className?: string;
	/** Rendered until the animation has loaded, and kept if it fails. */
	fallback?: ReactNode;
};

/** Decorative Lottie animation that plays only while on screen. */
export function LottiePlayer({
	animation,
	restFrame,
	className,
	fallback,
}: LottiePlayerProps) {
	const containerRef = useRef<HTMLDivElement>(null);
	const [loaded, setLoaded] = useState(false);

	useEffect(() => {
		const container = containerRef.current;
		if (!container) return;
		// A new animation starts unloaded, so the fallback shows until it is ready.
		setLoaded(false);

		let item: AnimationItem | undefined;
		let observer: IntersectionObserver | undefined;
		let cancelled = false;
		const reduceMotion = window.matchMedia(
			"(prefers-reduced-motion: reduce)",
		).matches;

		(async () => {
			const [{ default: lottie }, response] = await Promise.all([
				import("lottie-web/build/player/lottie_light"),
				fetch(`/animations/${animation}.json`),
			]);
			if (cancelled || !response.ok) return;
			const animationData = await response.json();
			if (cancelled) return;

			item = lottie.loadAnimation({
				container,
				renderer: "svg",
				loop: !reduceMotion,
				autoplay: false,
				animationData,
				rendererSettings: { preserveAspectRatio: "xMidYMid meet" },
			});
			item.addEventListener("DOMLoaded", () => {
				if (cancelled) return;
				setLoaded(true);
				if (reduceMotion) {
					item?.goToAndStop(restFrame, true);
					return;
				}
				observer = new IntersectionObserver(
					([entry]) => (entry.isIntersecting ? item?.play() : item?.pause()),
					{ threshold: 0.15 },
				);
				observer.observe(container);
			});
		})().catch(() => undefined);

		return () => {
			cancelled = true;
			observer?.disconnect();
			item?.destroy();
		};
	}, [animation, restFrame]);

	return (
		<div aria-hidden="true" className={cn("relative", className)}>
			{fallback && !loaded && (
				<div className="absolute inset-0">{fallback}</div>
			)}
			<div className="absolute inset-0" ref={containerRef} />
		</div>
	);
}
