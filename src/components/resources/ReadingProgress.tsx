"use client";

import { useEffect, useRef } from "react";

/**
 * 3px amber reading-progress bar pinned to the top of the viewport. Progress
 * is measured over the element with `targetId` (the prose body), from its top
 * reaching the top of the screen to its bottom reaching the bottom. It only
 * animates `transform`, and writes straight to the DOM to avoid re-renders.
 */
export function ReadingProgress({ targetId }: { targetId: string }) {
	const barRef = useRef<HTMLSpanElement>(null);

	useEffect(() => {
		let frame = 0;
		const update = () => {
			frame = 0;
			const target = document.getElementById(targetId);
			const bar = barRef.current;
			if (!target || !bar) return;
			const rect = target.getBoundingClientRect();
			const distance = rect.height - window.innerHeight;
			const progress =
				distance > 0 ? Math.min(Math.max(-rect.top / distance, 0), 1) : 1;
			bar.style.transform = `scaleX(${progress})`;
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
	}, [targetId]);

	return (
		<div
			aria-hidden="true"
			className="pointer-events-none fixed inset-x-0 top-0 z-[60] h-[3px]"
		>
			<span
				className="block h-full w-full origin-left scale-x-0 bg-product-primary"
				ref={barRef}
			/>
		</div>
	);
}
