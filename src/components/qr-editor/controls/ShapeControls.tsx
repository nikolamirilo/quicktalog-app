"use client";

import type { CornerDotType, CornerSquareType, DotType } from "qr-code-styling";
import type { ReactNode } from "react";
import { PanelHeading } from "@/components/qr-editor/controls/PanelHeading";
import { RadioTiles } from "@/components/qr-editor/controls/RadioTiles";
import {
	CORNER_DOT_STYLES,
	CORNER_FRAME_STYLES,
	DOT_STYLES,
} from "@/lib/qr/design";

const AMBER = "fill-product-primary-accent";
const MUTED = "fill-product-border-strong";

const SIX_CELLS: [number, number][] = [
	[3, 3],
	[11.5, 3],
	[3, 11.5],
	[20, 11.5],
	[11.5, 20],
	[20, 20],
];

const DOT_GLYPHS: Partial<Record<DotType, ReactNode>> = {
	square: SIX_CELLS.map(([x, y]) => (
		<rect height="7" key={`${x}-${y}`} width="7" x={x} y={y} />
	)),
	dots: SIX_CELLS.map(([x, y]) => (
		<circle cx={x + 3.5} cy={y + 3.5} key={`${x}-${y}`} r="3.4" />
	)),
	rounded: SIX_CELLS.map(([x, y]) => (
		<rect height="7" key={`${x}-${y}`} rx="2.4" width="7" x={x} y={y} />
	)),
	"extra-rounded": (
		<path d="M6.5 3h8.5a3.5 3.5 0 010 7H6.5a3.5 3.5 0 010-7zM6.5 11.5a3.5 3.5 0 010 7 3.5 3.5 0 010-7zM23.5 11.5a3.5 3.5 0 013.5 3.5v8.5a3.5 3.5 0 01-3.5 3.5H15a3.5 3.5 0 010-7h5v-5a3.5 3.5 0 013.5-3.5z" />
	),
	classy: (
		<path d="M6.5 3H10v7H3V6.5A3.5 3.5 0 016.5 3zM15 3h3.5v3.5A3.5 3.5 0 0115 10h-3.5V6.5A3.5 3.5 0 0115 3zM6.5 11.5H10v3.5a3.5 3.5 0 01-3.5 3.5H3V15a3.5 3.5 0 013.5-3.5zM23.5 11.5H27v3.5a3.5 3.5 0 01-3.5 3.5H20V15a3.5 3.5 0 013.5-3.5zM15 20h3.5v3.5A3.5 3.5 0 0115 27h-3.5v-3.5A3.5 3.5 0 0115 20zM23.5 20H27v3.5a3.5 3.5 0 01-3.5 3.5H20v-3.5a3.5 3.5 0 013.5-3.5z" />
	),
	"classy-rounded": (
		<path d="M3 3h3.5A3.5 3.5 0 0110 6.5V10H6.5A3.5 3.5 0 013 6.5zM11.5 3H15a3.5 3.5 0 013.5 3.5V10H15a3.5 3.5 0 01-3.5-3.5zM3 11.5h3.5A3.5 3.5 0 0110 15v3.5H6.5A3.5 3.5 0 013 15zM20 11.5h3.5A3.5 3.5 0 0127 15v3.5h-3.5A3.5 3.5 0 0120 15zM11.5 20H15a3.5 3.5 0 013.5 3.5V27H15a3.5 3.5 0 01-3.5-3.5zM20 20h3.5a3.5 3.5 0 013.5 3.5V27h-3.5a3.5 3.5 0 01-3.5-3.5z" />
	),
};

const FRAME_GLYPHS: Partial<Record<CornerSquareType, ReactNode>> = {
	square: (
		<>
			<path d="M4 4h22v22H4zM8 8v14h14V8z" fillRule="evenodd" />
			<rect className={AMBER} height="8" rx="1" width="8" x="11" y="11" />
		</>
	),
	dot: (
		<>
			<path
				d="M15 4a11 11 0 110 22 11 11 0 010-22zm0 4a7 7 0 100 14 7 7 0 000-14z"
				fillRule="evenodd"
			/>
			<circle className={AMBER} cx="15" cy="15" r="4" />
		</>
	),
	"extra-rounded": (
		<>
			<path
				d="M11 4h8a7 7 0 017 7v8a7 7 0 01-7 7h-8a7 7 0 01-7-7v-8a7 7 0 017-7zm0 4a3 3 0 00-3 3v8a3 3 0 003 3h8a3 3 0 003-3v-8a3 3 0 00-3-3z"
				fillRule="evenodd"
			/>
			<circle className={AMBER} cx="15" cy="15" r="4" />
		</>
	),
};

const CORNER_DOT_GLYPHS: Partial<Record<CornerDotType, ReactNode>> = {
	square: (
		<>
			<path
				className={MUTED}
				d="M4 4h22v22H4zM6.5 6.5v17h17v-17z"
				fillRule="evenodd"
			/>
			<rect height="10" width="10" x="10" y="10" />
		</>
	),
	dot: (
		<>
			<path
				className={MUTED}
				d="M4 4h22v22H4zM6.5 6.5v17h17v-17z"
				fillRule="evenodd"
			/>
			<circle cx="15" cy="15" r="5.5" />
		</>
	),
};

const svg = (content: ReactNode) => (
	<svg aria-hidden="true" viewBox="0 0 30 30">
		{content}
	</svg>
);

export function ShapeControls({
	dotsType,
	cornersSquareType,
	cornersDotType,
	onDotsTypeChange,
	onCornersSquareTypeChange,
	onCornersDotTypeChange,
}: {
	dotsType: DotType;
	cornersSquareType: CornerSquareType;
	cornersDotType: CornerDotType;
	onDotsTypeChange: (type: DotType) => void;
	onCornersSquareTypeChange: (type: CornerSquareType) => void;
	onCornersDotTypeChange: (type: CornerDotType) => void;
}) {
	return (
		<>
			<PanelHeading
				description="Choose the style for your QR code dots."
				title="Dots pattern"
			/>
			<RadioTiles
				glyph={(v) => svg(DOT_GLYPHS[v])}
				label="Dots pattern"
				onChange={onDotsTypeChange}
				options={DOT_STYLES}
				value={dotsType}
				wide
			/>

			<PanelHeading
				className="mt-6"
				description="Style the frame around corner markers."
				title="Corner frames"
			/>
			<RadioTiles
				glyph={(v) => svg(FRAME_GLYPHS[v])}
				label="Corner frames"
				onChange={onCornersSquareTypeChange}
				options={CORNER_FRAME_STYLES}
				value={cornersSquareType}
			/>

			<PanelHeading
				className="mt-6"
				description="Style the dot inside corner markers."
				title="Corner dots"
			/>
			<RadioTiles
				glyph={(v) => svg(CORNER_DOT_GLYPHS[v])}
				label="Corner dots"
				onChange={onCornersDotTypeChange}
				options={CORNER_DOT_STYLES}
				value={cornersDotType}
			/>
		</>
	);
}
