"use client";

import { AlertTriangle } from "lucide-react";
import { useEffect, useId, useState } from "react";
import { PanelHeading } from "@/components/qr-editor/controls/PanelHeading";
import { COLOR_PRESETS, HEX_COLOR, type QrColors } from "@/lib/qr/design";
import type { ScanRisk } from "@/lib/qr/scan-risk";
import { cn } from "@/lib/ui/cn";

const ROWS: { key: keyof QrColors; name: string; hint: string }[] = [
	{ key: "dots", name: "QR Dots", hint: "The data pattern" },
	{ key: "background", name: "Background", hint: "Behind the code" },
	{
		key: "cornerFrames",
		name: "Corner Frames",
		hint: "Outer ring of the 3 markers",
	},
	{ key: "cornerDots", name: "Corner Dots", hint: "Centre of the 3 markers" },
];

/** A tiny QR-like glyph in a preset's colours. */
function PresetGlyph({ colors }: { colors: QrColors }) {
	const finders = [
		[2, 2],
		[15, 2],
		[2, 15],
	];
	const dots = [
		[11, 3],
		[11, 6.5],
		[11, 11],
		[14.5, 11],
		[18, 11],
		[18, 14.5],
		[14.5, 18],
		[18, 19],
		[11, 18],
		[4, 11.2],
		[7, 11.2],
	];
	return (
		<svg
			aria-hidden="true"
			className="block h-full w-full rounded-[9px] shadow-[inset_0_0_0_1px_rgb(var(--product-foreground-rgb)/0.08)]"
			viewBox="0 0 24 24"
		>
			<rect fill={colors.background} height="24" width="24" />
			{finders.map(([x, y]) => (
				<g key={`${x}-${y}`}>
					<path
						d={`M${x} ${y}h7v7h-7zM${x + 1.4} ${y + 1.4}v4.2h4.2v-4.2z`}
						fill={colors.cornerFrames}
						fillRule="evenodd"
					/>
					<rect
						fill={colors.cornerDots}
						height="2.2"
						rx=".4"
						width="2.2"
						x={x + 2.4}
						y={y + 2.4}
					/>
				</g>
			))}
			{dots.map(([x, y]) => (
				<rect
					fill={colors.dots}
					height="2.4"
					key={`${x}-${y}`}
					rx=".6"
					width="2.4"
					x={x}
					y={y}
				/>
			))}
		</svg>
	);
}

function ColorRow({
	name,
	hint,
	value,
	onChange,
}: {
	name: string;
	hint: string;
	value: string;
	onChange: (color: string) => void;
}) {
	const id = useId();
	const [draft, setDraft] = useState(value.toUpperCase());
	const [focused, setFocused] = useState(false);
	const invalid = !HEX_COLOR.test(draft);

	// Presets and the swatch change the value from outside the text field.
	useEffect(() => {
		if (!focused) setDraft(value.toUpperCase());
	}, [value, focused]);

	return (
		<div className="flex min-w-0 items-center gap-3 bg-product-card px-3 py-2.5">
			<label className="relative h-9 w-9 shrink-0 cursor-pointer overflow-hidden rounded-[11px] shadow-[inset_0_0_0_1px_rgb(var(--product-foreground-rgb)/0.14),0_1px_2px_rgb(var(--product-foreground-rgb)/0.08)] focus-within:outline focus-within:outline-[3px] focus-within:outline-offset-2 focus-within:outline-product-secondary">
				<input
					aria-label={`${name} color`}
					className="absolute -inset-2 h-[calc(100%+16px)] w-[calc(100%+16px)] cursor-pointer border-0 bg-transparent p-0"
					onChange={(e) => onChange(e.target.value.toUpperCase())}
					type="color"
					value={HEX_COLOR.test(value) ? value.toLowerCase() : "#000000"}
				/>
			</label>
			<span className="flex min-w-0 flex-1 flex-col gap-0.5">
				<b className="text-sm font-semibold leading-tight">{name}</b>
				<small className="truncate text-xs text-product-muted">{hint}</small>
			</span>
			<input
				aria-describedby={invalid ? `${id}-err` : undefined}
				aria-invalid={invalid}
				aria-label={`${name} hex value`}
				autoComplete="off"
				className={cn(
					"h-[34px] w-[86px] shrink-0 rounded-[10px] border border-product-border-strong bg-product-background px-[9px] font-mono text-[13px] uppercase text-product-foreground focus:border-product-primary-accent focus:bg-product-card focus:shadow-[0_0_0_4px_rgb(var(--product-primary-rgb)/0.2)] focus:outline-none",
					invalid &&
						"border-product-error shadow-[0_0_0_3px_rgb(var(--product-error-rgb)/0.14)] focus:border-product-error",
				)}
				maxLength={7}
				onBlur={() => {
					setFocused(false);
					setDraft(value.toUpperCase());
				}}
				onChange={(e) => {
					let next = e.target.value.trim().toUpperCase();
					if (next && !next.startsWith("#")) next = `#${next}`;
					setDraft(next);
					if (HEX_COLOR.test(next)) onChange(next);
				}}
				onFocus={() => setFocused(true)}
				spellCheck={false}
				type="text"
				value={draft}
			/>
			{invalid && (
				<span className="sr-only" id={`${id}-err`}>
					Use a 6-digit hex colour like #16140F.
				</span>
			)}
		</div>
	);
}

export function ColorControls({
	colors,
	risk,
	onChange,
}: {
	colors: QrColors;
	risk: ScanRisk;
	onChange: (colors: Partial<QrColors>) => void;
}) {
	const same = (a: string, b: string) => a.toUpperCase() === b.toUpperCase();

	return (
		<>
			<PanelHeading
				description="Customize your QR code colors."
				title="Color palette"
			/>
			<div
				aria-label="Color presets"
				className="mb-4 grid grid-cols-5 gap-2"
				role="group"
			>
				{COLOR_PRESETS.map((preset) => {
					const pressed = (
						Object.keys(preset.colors) as (keyof QrColors)[]
					).every((key) => same(preset.colors[key], colors[key]));
					return (
						<button
							aria-pressed={pressed}
							className={cn(
								"flex min-w-0 flex-col items-center gap-[7px] rounded-[14px] border-[1.5px] border-product-border bg-product-card px-1 pb-[9px] pt-2 text-center text-[11px] font-semibold leading-tight text-product-foreground-accent transition-[border-color,box-shadow,transform] hover:-translate-y-px hover:border-product-border-strong sm:text-xs",
								pressed &&
									"border-product-primary-accent text-product-foreground shadow-[0_0_0_3px_rgb(var(--product-primary-rgb)/0.25)] hover:border-product-primary-accent",
							)}
							key={preset.name}
							onClick={() => onChange(preset.colors)}
							type="button"
						>
							<span className="block aspect-square w-full max-w-[52px]">
								<PresetGlyph colors={preset.colors} />
							</span>
							<span>{preset.name}</span>
						</button>
					);
				})}
			</div>

			<div className="grid grid-cols-1 overflow-hidden rounded-2xl border border-product-border sm:grid-cols-2 [&>*+*]:border-t [&>*]:border-product-border sm:[&>*:nth-child(2)]:border-t-0 sm:[&>*:nth-child(odd)]:border-r">
				{ROWS.map((row) => (
					<ColorRow
						hint={row.hint}
						key={row.key}
						name={row.name}
						onChange={(color) => onChange({ [row.key]: color })}
						value={colors[row.key]}
					/>
				))}
			</div>

			<p
				className={cn(
					"mt-3 inline-flex h-[30px] items-center gap-2 rounded-full border px-3 text-[12.5px] font-semibold leading-none",
					risk.lowContrast
						? "border-product-primary/50 bg-product-primary-soft text-product-primary-ink"
						: "border-product-success/[0.22] bg-product-success-soft text-product-success",
				)}
			>
				<i aria-hidden="true" className="h-2 w-2 rounded-full bg-current" />
				Contrast {risk.ratio.toFixed(1)}:1 · {risk.lowContrast ? "Low" : "Good"}
			</p>

			{risk.lowContrast && (
				<div className="mt-2.5 flex gap-2.5 rounded-[14px] border border-product-primary/50 bg-product-primary-soft px-3.5 py-3 text-[13px] leading-snug text-product-foreground-accent">
					<AlertTriangle
						aria-hidden="true"
						className="mt-px h-[18px] w-[18px] shrink-0 text-product-primary-ink"
					/>
					<div>
						<b className="block text-product-foreground">
							Low Contrast Warning
						</b>
						<p>
							Your QR code may be hard to scan. Try increasing the contrast
							between colors.
						</p>
					</div>
				</div>
			)}
		</>
	);
}
