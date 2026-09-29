"use client";
import { type ContentLayout, layouts } from "@quicktalog/common";
import type { ReactNode } from "react";
import { useRadioKeys } from "@/hooks/useRadioKeys";
import { cn } from "@/lib/ui/cn";

const KEYS = layouts.map((l) => l.key as ContentLayout);

const img = "fill-product-primary/70";
const card = "fill-product-card stroke-product-border-strong";
const line = "fill-product-muted/60";

/** Drawn thumbnail of each item layout (the old JPG thumbnails are gone). */
const GLYPHS: Record<ContentLayout, ReactNode> = {
	// Side image: stacked cards, image on the left, text on the right.
	variant_1: (
		<>
			{[3, 20].map((y) => (
				<g key={y}>
					<rect className={card} height="14" rx="2.5" width="42" x="3" y={y} />
					<rect
						className={img}
						height="10"
						rx="1.5"
						width="10"
						x="5"
						y={y + 2}
					/>
					<rect
						className={line}
						height="2.5"
						rx="1"
						width="18"
						x="18"
						y={y + 3.5}
					/>
					<rect
						className={line}
						height="2"
						rx="1"
						width="24"
						x="18"
						y={y + 8}
					/>
				</g>
			))}
		</>
	),
	// Top image: two cards side by side, image above the text.
	variant_2: (
		<>
			{[3, 25].map((x) => (
				<g key={x}>
					<rect className={card} height="30" rx="2.5" width="20" x={x} y="3" />
					<rect
						className={img}
						height="13"
						rx="1.5"
						width="16"
						x={x + 2}
						y="5"
					/>
					<rect
						className={line}
						height="2.5"
						rx="1"
						width="12"
						x={x + 2}
						y="21"
					/>
					<rect
						className={line}
						height="2"
						rx="1"
						width="16"
						x={x + 2}
						y="26"
					/>
				</g>
			))}
		</>
	),
	// Text only: stacked cards with a name, a description and a price.
	variant_3: (
		<>
			{[3, 20].map((y) => (
				<g key={y}>
					<rect className={card} height="14" rx="2.5" width="42" x="3" y={y} />
					<rect
						className={line}
						height="2.5"
						rx="1"
						width="20"
						x="6"
						y={y + 3.5}
					/>
					<rect className={line} height="2" rx="1" width="28" x="6" y={y + 8} />
					<rect
						className={img}
						height="2.5"
						rx="1"
						width="6"
						x="36"
						y={y + 3.5}
					/>
				</g>
			))}
		</>
	),
	// Carousel: one card in focus, its neighbours cut off, and page dots.
	variant_4: (
		<>
			<rect className={card} height="22" rx="2.5" width="10" x="-4" y="5" />
			<rect className={card} height="22" rx="2.5" width="10" x="42" y="5" />
			<rect className={card} height="26" rx="2.5" width="28" x="10" y="3" />
			<rect className={img} height="12" rx="1.5" width="24" x="12" y="5" />
			<rect className={line} height="2.5" rx="1" width="14" x="12" y="20" />
			<rect className={line} height="2" rx="1" width="20" x="12" y="24.5" />
			<circle className="fill-product-primary" cx="20" cy="33" r="1.5" />
			<circle className={line} cx="24" cy="33" r="1.5" />
			<circle className={line} cx="28" cy="33" r="1.5" />
		</>
	),
};

/** Item layout choice as radio tiles, keyboard-operable with the arrow keys. */
export function LayoutPicker({
	value,
	onChange,
	labelledBy,
}: {
	value: string;
	onChange: (value: ContentLayout) => void;
	labelledBy: string;
}) {
	const { onKeyDown, itemProps } = useRadioKeys(
		KEYS,
		value as ContentLayout,
		onChange,
	);

	return (
		<div
			aria-labelledby={labelledBy}
			className="grid max-w-[560px] grid-cols-2 gap-2 min-[360px]:grid-cols-4"
			onKeyDown={onKeyDown}
			role="radiogroup"
		>
			{layouts.map((layout, i) => {
				const key = layout.key as ContentLayout;
				const checked = key === value;
				return (
					<button
						{...itemProps(key, i)}
						className={cn(
							"relative flex min-w-0 flex-col items-center gap-2 rounded-[14px] border-[1.5px] border-product-border bg-product-card px-1.5 pb-2.5 pt-2 text-[12.5px] font-semibold leading-tight text-product-foreground-accent transition-[border-color,box-shadow,transform] hover:-translate-y-px hover:border-product-border-strong",
							checked &&
								"border-product-primary-accent text-product-foreground shadow-[0_0_0_3px_rgb(var(--product-primary-rgb)/0.25)] hover:border-product-primary-accent",
						)}
						key={key}
					>
						<span
							aria-hidden="true"
							className={cn(
								"grid aspect-[4/3] w-full place-items-center overflow-hidden rounded-[10px] bg-product-background-hero transition-colors",
								checked && "bg-product-primary-soft",
							)}
						>
							<svg
								className="h-auto w-[78%] max-w-[88px] overflow-visible"
								viewBox="0 0 48 36"
							>
								<g strokeWidth="0.75">{GLYPHS[key]}</g>
							</svg>
						</span>
						<span className="text-center">{layout.label}</span>
						{checked && (
							<span
								aria-hidden="true"
								className="absolute -right-[7px] -top-[7px] grid h-5 w-5 place-items-center rounded-full bg-product-primary shadow-[0_0_0_2px_var(--product-card)]"
							>
								<svg
									className="h-3 w-3"
									fill="none"
									stroke="currentColor"
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={3.4}
									viewBox="0 0 24 24"
								>
									<polyline points="20 6 9 17 4 12" />
								</svg>
							</span>
						)}
					</button>
				);
			})}
		</div>
	);
}
