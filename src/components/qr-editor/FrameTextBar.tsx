"use client";

import { useEffect, useState } from "react";
import {
	baseFrameLayout,
	type FrameLayout,
	frameLayout,
} from "@/lib/qr/export";

/**
 * The frame text under the preview, drawn as an SVG with the export's sizing
 * rule (one line, shrink to fit), so the preview matches the download.
 */
export function FrameTextBar({
	text,
	width,
	barColor,
	textColor,
}: {
	text: string;
	/** The code's width in px: the bar is laid out at the export's scale. */
	width: number;
	barColor: string;
	textColor: string;
}) {
	const [layout, setLayout] = useState<FrameLayout>(() =>
		baseFrameLayout(width),
	);

	useEffect(() => {
		let active = true;
		const measure = () => {
			if (active) setLayout(frameLayout(text, width));
		};
		measure();
		// Measure again once the heading font has loaded.
		document.fonts?.ready.then(measure).catch(() => {});
		return () => {
			active = false;
		};
	}, [text, width]);

	return (
		<svg
			aria-label={`Frame text: ${text}`}
			className="block h-auto w-full"
			role="img"
			viewBox={`0 0 ${width} ${layout.bar}`}
		>
			<rect fill={barColor} height={layout.bar} width={width} />
			<text
				dominantBaseline="central"
				fill={textColor}
				fontSize={layout.fontSize}
				fontWeight={800}
				style={{ fontFamily: "var(--product-font-heading), Arial, sans-serif" }}
				textAnchor="middle"
				x={width / 2}
				y={layout.bar / 2}
				{...(layout.textWidth === null
					? {}
					: {
							textLength: layout.textWidth,
							lengthAdjust: "spacingAndGlyphs",
						})}
			>
				{text}
			</text>
		</svg>
	);
}
