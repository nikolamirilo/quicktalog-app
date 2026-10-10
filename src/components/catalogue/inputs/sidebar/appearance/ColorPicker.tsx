"use client";

import * as SliderPrimitive from "@radix-ui/react-slider";
import { Check } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { type Hsv, hexToHsv, hsvToHex } from "@/lib/color/hsv";
import { isDarkBackground } from "@/lib/themes/custom-theme";
import { cn } from "@/lib/ui/cn";

const HEX = /^#[0-9a-f]{6}$/i;

const HUE_TRACK =
	"linear-gradient(to right, #ff0000, #ffff00, #00ff00, #00ffff, #0000ff, #ff00ff, #ff0000)";

/** Neutrals first, then a spread of common menu colours. */
const PRESETS = [
	"#ffffff",
	"#f5f0e8",
	"#d4d4d4",
	"#737373",
	"#262626",
	"#000000",
	"#c77f00",
	"#b91c1c",
	"#ea580c",
	"#15803d",
	"#1d4ed8",
	"#7e22ce",
];

const clamp01 = (n: number) => Math.min(1, Math.max(0, n));

/**
 * A grey or black has no hue of its own, so moving to one keeps the hue (and,
 * for black, the saturation) already on the pad instead of snapping to red.
 */
const carryHue = (next: Hsv, current: Hsv): Hsv => {
	if (next.v === 0) return { h: current.h, s: current.s, v: 0 };
	if (next.s === 0) return { ...next, h: current.h };
	return next;
};

interface ColorPickerProps {
	/** What the colour is for, e.g. "Page background". Names the controls. */
	label: string;
	value: string;
	onChange: (hex: string) => void;
	/** Colours already in the theme, offered first as quick picks. */
	swatches?: string[];
}

/**
 * The swatch beside a hex field. It opens an in-app picker (a saturation and
 * brightness pad, a hue slider and quick picks) in place of the browser's own
 * colour dialog, which looked dated and differed from browser to browser.
 */
export function ColorPicker({
	label,
	value,
	onChange,
	swatches = [],
}: ColorPickerProps) {
	const [hsv, setHsv] = useState<Hsv>(() => hexToHsv(value));
	const padRef = useRef<HTMLDivElement>(null);
	const onChangeRef = useRef(onChange);
	onChangeRef.current = onChange;
	const frame = useRef<number | null>(null);
	const pending = useRef(value);
	/** The last colour this picker sent, so its own echo isn't read as outside. */
	const lastSent = useRef<string | null>(null);

	// Follow a colour set from outside: a typed hex, a saved theme, the AI. The
	// picker's own change coming back a frame late is skipped, or a fast drag
	// would pull the thumb back to where it just was.
	useEffect(() => {
		if (!HEX.test(value)) return;
		const hex = value.toLowerCase();
		if (hex === lastSent.current) return;
		lastSent.current = null;
		setHsv((current) =>
			hsvToHex(current) === hex ? current : carryHue(hexToHsv(hex), current),
		);
	}, [value]);

	useEffect(
		() => () => {
			if (frame.current !== null) cancelAnimationFrame(frame.current);
		},
		[],
	);

	/** A drag fires many changes per frame; the catalogue only needs the last. */
	const emit = (hex: string) => {
		pending.current = hex;
		if (frame.current !== null) return;
		frame.current = requestAnimationFrame(() => {
			frame.current = null;
			lastSent.current = pending.current;
			onChangeRef.current(pending.current);
		});
	};

	const commit = (next: Hsv) => {
		setHsv(next);
		emit(hsvToHex(next));
	};

	const pickAt = (clientX: number, clientY: number) => {
		const rect = padRef.current?.getBoundingClientRect();
		if (!rect || rect.width === 0 || rect.height === 0) return;
		commit({
			...hsv,
			s: clamp01((clientX - rect.left) / rect.width),
			v: clamp01(1 - (clientY - rect.top) / rect.height),
		});
	};

	const handlePadKey = (event: React.KeyboardEvent<HTMLDivElement>) => {
		const step = event.shiftKey ? 0.1 : 0.01;
		const moves: Record<string, Partial<Hsv>> = {
			ArrowLeft: { s: clamp01(hsv.s - step) },
			ArrowRight: { s: clamp01(hsv.s + step) },
			ArrowUp: { v: clamp01(hsv.v + step) },
			ArrowDown: { v: clamp01(hsv.v - step) },
		};
		const move = moves[event.key];
		if (!move) return;
		event.preventDefault();
		commit({ ...hsv, ...move });
	};

	const current = (HEX.test(value) ? value : hsvToHex(hsv)).toLowerCase();
	const picks = [
		...new Set([...swatches, ...PRESETS].map((c) => c.toLowerCase())),
	]
		.filter((c) => HEX.test(c))
		.slice(0, 18);
	const pureHue = hsvToHex({ h: hsv.h, s: 1, v: 1 });

	return (
		<Popover>
			<PopoverTrigger asChild>
				<button
					aria-label={`Pick the ${label.toLowerCase()} color`}
					className="h-11 w-11 shrink-0 rounded-xl border border-product-border-strong shadow-sm transition-transform hover:scale-[1.04] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-product-primary/25 data-[state=open]:ring-4 data-[state=open]:ring-product-primary/25"
					style={{ backgroundColor: current }}
					type="button"
				/>
			</PopoverTrigger>
			<PopoverContent
				align="end"
				className="z-[2000] w-[248px] max-w-[calc(100vw-32px)] space-y-3 p-3"
				collisionPadding={16}
			>
				<div
					aria-label={`${label}: saturation and brightness`}
					aria-valuemax={100}
					aria-valuemin={0}
					aria-valuenow={Math.round(hsv.s * 100)}
					aria-valuetext={`Saturation ${Math.round(hsv.s * 100)}%, brightness ${Math.round(hsv.v * 100)}%`}
					className="relative h-36 w-full cursor-crosshair touch-none rounded-xl outline-none focus-visible:ring-4 focus-visible:ring-product-primary/25"
					onKeyDown={handlePadKey}
					onPointerDown={(event) => {
						event.currentTarget.setPointerCapture(event.pointerId);
						pickAt(event.clientX, event.clientY);
					}}
					onPointerMove={(event) => {
						if (event.currentTarget.hasPointerCapture(event.pointerId)) {
							pickAt(event.clientX, event.clientY);
						}
					}}
					ref={padRef}
					role="slider"
					style={{
						backgroundColor: pureHue,
						backgroundImage:
							"linear-gradient(to top, #000000, transparent), linear-gradient(to right, #ffffff, transparent)",
					}}
					tabIndex={0}
				>
					<span
						aria-hidden="true"
						className="pointer-events-none absolute h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-[0_0_0_1px_rgba(0,0,0,0.35)]"
						style={{
							backgroundColor: hsvToHex(hsv),
							left: `${hsv.s * 100}%`,
							top: `${(1 - hsv.v) * 100}%`,
						}}
					/>
				</div>

				<SliderPrimitive.Root
					className="relative flex h-5 w-full cursor-pointer touch-none select-none items-center"
					max={359}
					min={0}
					onValueChange={([h]) => commit({ ...hsv, h })}
					step={1}
					value={[Math.round(hsv.h) % 360]}
				>
					<SliderPrimitive.Track
						className="relative h-3 w-full grow rounded-full"
						style={{ background: HUE_TRACK }}
					/>
					<SliderPrimitive.Thumb
						aria-label={`${label}: hue`}
						className="block h-5 w-5 rounded-full border-2 border-white shadow-[0_0_0_1px_rgba(0,0,0,0.35),0_2px_6px_rgba(22,20,15,0.18)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-product-primary/25"
						style={{ backgroundColor: pureHue }}
					/>
				</SliderPrimitive.Root>

				<ul aria-label="Quick picks" className="grid grid-cols-6 gap-1.5">
					{picks.map((pick) => {
						const selected = pick === current;
						return (
							<li key={pick}>
								<button
									aria-label={`Use ${pick}`}
									aria-pressed={selected}
									className="flex aspect-square w-full items-center justify-center rounded-lg border border-product-border-strong transition-transform hover:scale-[1.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-product-primary"
									onClick={() => {
										setHsv(carryHue(hexToHsv(pick), hsv));
										onChange(pick);
									}}
									style={{ backgroundColor: pick }}
									type="button"
								>
									{selected && (
										<Check
											aria-hidden="true"
											className={cn(
												"h-3.5 w-3.5",
												isDarkBackground(pick) ? "text-white" : "text-black",
											)}
											strokeWidth={3}
										/>
									)}
								</button>
							</li>
						);
					})}
				</ul>
			</PopoverContent>
		</Popover>
	);
}
