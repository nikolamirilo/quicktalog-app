"use client";

import { type CSSProperties, type TouchEvent, useRef, useState } from "react";

const CLOSE_DISTANCE = 96;

/**
 * Drag a bottom sheet down with a finger and close it past a threshold.
 * Spread `handleProps` on the drag area (a photo or a handle, not the
 * scrolling body) and `style` on the sheet.
 */
export function useSwipeToClose({
	open,
	onClose,
	enabled,
}: {
	open: boolean;
	onClose: () => void;
	enabled: boolean;
}) {
	const startY = useRef<number | null>(null);
	const [offset, setOffset] = useState(0);
	const [dragging, setDragging] = useState(false);
	const [wasOpen, setWasOpen] = useState(open);

	// The offset is kept while a swiped sheet animates out, so clear it on the next open.
	if (open !== wasOpen) {
		setWasOpen(open);
		if (open) setOffset(0);
	}

	const onTouchStart = (event: TouchEvent) => {
		if (!enabled || (event.target as Element).closest("button")) return;
		startY.current = event.touches[0].clientY;
		setDragging(true);
	};

	const onTouchMove = (event: TouchEvent) => {
		if (startY.current === null) return;
		setOffset(Math.max(0, event.touches[0].clientY - startY.current));
	};

	const onTouchEnd = () => {
		if (startY.current === null) return;
		startY.current = null;
		setDragging(false);
		if (offset > CLOSE_DISTANCE) onClose();
		else setOffset(0);
	};

	const style: CSSProperties | undefined = offset
		? {
				transform: `translateY(${offset}px)`,
				transition: dragging ? "none" : undefined,
			}
		: undefined;

	return {
		handleProps: {
			onTouchStart,
			onTouchMove,
			onTouchEnd,
			onTouchCancel: onTouchEnd,
		},
		style,
	};
}
