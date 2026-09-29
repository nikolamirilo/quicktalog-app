"use client";

import { type TouchEvent, useRef } from "react";

const SWIPE_DISTANCE = 50;
const SWIPE_VELOCITY = 0.3; // px per ms

/**
 * Horizontal swipe detection for touch devices. Spread the returned handlers
 * on the swipe area; vertical drags are ignored so the page still scrolls.
 */
export function useSwipe({
	onNext,
	onPrevious,
}: {
	onNext: () => void;
	onPrevious: () => void;
}) {
	const start = useRef<{ x: number; y: number; time: number } | null>(null);

	const onTouchStart = (event: TouchEvent) => {
		const touch = event.touches[0];
		start.current = { x: touch.clientX, y: touch.clientY, time: Date.now() };
	};

	const onTouchEnd = (event: TouchEvent) => {
		const origin = start.current;
		start.current = null;
		if (!origin) return;
		const touch = event.changedTouches[0];
		const dx = touch.clientX - origin.x;
		const dy = touch.clientY - origin.y;
		if (Math.abs(dy) > Math.abs(dx)) return;
		const velocity = Math.abs(dx) / Math.max(Date.now() - origin.time, 1);
		if (Math.abs(dx) > SWIPE_DISTANCE || velocity > SWIPE_VELOCITY) {
			if (dx < 0) onNext();
			else onPrevious();
		}
	};

	return { onTouchStart, onTouchEnd };
}
