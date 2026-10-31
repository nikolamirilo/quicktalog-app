"use client";

import {
	PillToggle,
	SliderField,
} from "@/components/catalogue/inputs/sidebar/panel";
import {
	GLASS_LIMITS,
	GLASS_TARGETS,
	normalizeGlass,
	resolveGlass,
} from "@/lib/catalogue/glass";
import { cn } from "@/lib/ui/cn";
import type { GlassLevel, GlassSettings } from "@quicktalog/common";
import { ChevronDown, Info, RotateCcw } from "lucide-react";
import { useState } from "react";

export const GLASS_PANEL_ID = "panel-glass";

interface GlassConfigurationProps {
	glass: GlassSettings | undefined;
	onChange: (glass: GlassSettings) => void;
}

const hintClass = "mt-1.5 text-[12.5px] leading-snug text-product-muted";

/** Level, surfaces and the fine-tune sliders of the glass effect. */
const GlassConfiguration = ({ glass, onChange }: GlassConfigurationProps) => {
	const [tuneOpen, setTuneOpen] = useState(false);
	const current = normalizeGlass(glass);
	const resolved = resolveGlass(current);
	const off = !resolved.on;
	const untuned = { opacity: null, frost: null, splay: null };
	const set = (patch: Partial<GlassSettings>) =>
		onChange({ ...current, ...patch });

	return (
		<div
			className="scroll-mt-4 space-y-5 border-t border-product-border pt-4"
			id={GLASS_PANEL_ID}
		>
			<SliderField
				info="Makes the navbar, search bar, section headers and item cards see-through, like frosted glass. What sits behind them shows through softly, most of all under the navbar while visitors scroll."
				label="Glass effect"
				marks={["Off", "Clear", "Semi", "Frosted"]}
				max={3}
				min={0}
				onValueChange={(level) =>
					set({ level: level as GlassLevel, ...untuned })
				}
				step={1}
				value={current.level}
				valueText={
					resolved.tuned
						? `${resolved.preset.label}, tuned`
						: resolved.preset.label
				}
			/>

			<fieldset className="space-y-2">
				<legend className="mb-2 text-[13.5px] font-semibold leading-none text-product-foreground">
					Use glass on
				</legend>
				<div className="flex flex-wrap gap-2">
					{GLASS_TARGETS.map(({ key, label }) => (
						<PillToggle
							checked={current.apply[key]}
							disabled={off}
							id={`glass-on-${key}`}
							key={key}
							onCheckedChange={(on) =>
								set({ apply: { ...current.apply, [key]: on } })
							}
						>
							{label}
						</PillToggle>
					))}
				</div>
			</fieldset>

			{off && (
				<p className="flex gap-2 rounded-xl border border-product-border bg-product-background-hero px-3 py-2 text-[13px] leading-snug text-product-foreground-accent">
					<Info
						aria-hidden="true"
						className="mt-px h-4 w-4 shrink-0 text-product-primary-ink"
					/>
					Off keeps every surface solid.
				</p>
			)}

			<div>
				<button
					aria-controls="glass-tune"
					aria-expanded={tuneOpen && !off}
					className="flex min-h-11 w-full items-center gap-3 border-t border-product-border px-0.5 text-left text-[13.5px] font-semibold text-product-foreground disabled:cursor-not-allowed disabled:opacity-50"
					disabled={off}
					onClick={() => setTuneOpen((open) => !open)}
					type="button"
				>
					Fine-tune
					<small className="ml-auto truncate text-[12.5px] font-medium text-product-muted">
						Opacity {resolved.opacity}% · Frost {resolved.frost}px · Splay{" "}
						{resolved.splay}px
					</small>
					<ChevronDown
						aria-hidden="true"
						className={cn(
							"h-4 w-4 shrink-0 text-product-muted transition-transform",
							tuneOpen && !off && "rotate-180",
						)}
					/>
				</button>

				{tuneOpen && !off && (
					<div className="space-y-4 pt-1.5" id="glass-tune">
						<div>
							<SliderField
								label="Opacity"
								marks={["See-through", "Solid"]}
								max={GLASS_LIMITS.opacity.max}
								min={GLASS_LIMITS.opacity.min}
								onValueChange={(opacity) => set({ opacity })}
								step={5}
								value={resolved.opacity}
								valueText={`${resolved.opacity}%`}
							/>
							<p className={hintClass}>
								Lower lets more of the page show through.
							</p>
						</div>
						<div>
							<SliderField
								label="Frost"
								marks={["Sharp", "Soft"]}
								max={GLASS_LIMITS.frost.max}
								min={GLASS_LIMITS.frost.min}
								onValueChange={(frost) => set({ frost })}
								step={1}
								value={resolved.frost}
								valueText={`${resolved.frost}px`}
							/>
							<p className={hintClass}>
								Blur of what's behind, like content scrolling under the navbar.
								Phones cap it at 20 px.
							</p>
						</div>
						<div>
							<SliderField
								label="Splay"
								marks={["Flat", "Thick"]}
								max={GLASS_LIMITS.splay.max}
								min={GLASS_LIMITS.splay.min}
								onValueChange={(splay) => set({ splay })}
								step={1}
								value={resolved.splay}
								valueText={`${resolved.splay}px`}
							/>
							<p className={hintClass}>
								Light along the edges. Past 16 px it starts to glow.
							</p>
						</div>
						{resolved.tuned && (
							<button
								className="inline-flex items-center gap-1.5 border-b-[1.5px] border-product-primary/70 pb-px text-[13px] font-semibold text-product-primary-ink hover:text-product-foreground"
								onClick={() => set(untuned)}
								type="button"
							>
								<RotateCcw aria-hidden="true" className="h-3.5 w-3.5" />
								Reset to {resolved.preset.label}
							</button>
						)}
					</div>
				)}
			</div>
		</div>
	);
};

export default GlassConfiguration;
