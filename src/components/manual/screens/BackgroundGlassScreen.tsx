import {
	Check,
	ChevronDown,
	Droplet,
	Image as ImageIcon,
	Info,
	Palette,
} from "lucide-react";
import type { ReactNode } from "react";

import { Screen, SpotMarker } from "@/components/manual/Screen";
import { BACKGROUND_GRADIENTS } from "@/lib/catalogue/background";
import { GLASS_TARGETS } from "@/lib/catalogue/glass";
import { cn } from "@/lib/ui/cn";

/**
 * The Appearance tab scrolled to Background and Style. Drawn at the panel's
 * real width (440px) with the real classes, because the shared panel kit draws
 * an older, smaller card and a thinner slider than the builder now uses.
 */

/** The three background types, in the order the radiogroup lists them. */
const BACKGROUND_TYPES = [
	{ icon: ImageIcon, label: "Photo" },
	{ icon: Droplet, label: "Gradient" },
	{ icon: Palette, label: "Colour" },
];

const hintClass = "mt-1.5 text-[12.5px] leading-snug text-product-muted";

/** The (i) dot beside a heading or a field label: grey, 16px, 28px hit area. */
function InfoDot() {
	return (
		<span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-product-muted">
			<Info aria-hidden="true" className="h-4 w-4" />
		</span>
	);
}

/** One white card in the panel: 22px radius, 16px padding, (i) after the title. */
function PanelCard({
	children,
	title,
}: {
	children: ReactNode;
	title: string;
}) {
	return (
		<section className="space-y-4 rounded-product-card border border-product-border bg-product-card p-4 font-product-body">
			<div className="flex min-h-7 items-start justify-between gap-3">
				<div className="flex min-w-0 items-center gap-1">
					<h3 className="font-product-heading text-[15px] font-bold leading-snug text-product-foreground">
						{title}
					</h3>
					<InfoDot />
				</div>
			</div>
			{children}
		</section>
	);
}

/** The panel's field label: 13.5px, semibold, flush with the card's content. */
function FieldLabel({ children }: { children: ReactNode }) {
	return (
		<span className="text-[13.5px] font-semibold leading-none text-product-foreground">
			{children}
		</span>
	);
}

/**
 * Label and value, the 44px slider, then the marks. The marks sit 4px under
 * the track: the component's `-mt-2` loses to `space-y-1`. The thumb travels
 * inset by half its width, so it never lines up with the end marks.
 */
function SliderField({
	fill,
	info = false,
	label,
	marks,
	value,
}: {
	/** Where the thumb sits along the track, 0 to 100. */
	fill: number;
	/** Draws the (i) dot after the label, which only Glass effect has. */
	info?: boolean;
	label: string;
	marks?: string[];
	value: string;
}) {
	return (
		<div className="space-y-1">
			<div className="flex items-baseline justify-between gap-3">
				<div className="flex items-center gap-1">
					<FieldLabel>{label}</FieldLabel>
					{info ? <InfoDot /> : null}
				</div>
				<span className="text-[13px] font-semibold capitalize tabular-nums text-product-foreground-accent">
					{value}
				</span>
			</div>
			<div className="flex h-11 w-full items-center">
				<div className="relative h-1.5 w-full rounded-full bg-product-border-strong">
					<span
						className="absolute inset-y-0 left-0 rounded-full bg-product-primary-accent"
						style={{ width: `${fill}%` }}
					/>
					<span
						className="absolute top-1/2 h-[22px] w-[22px] -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-product-primary bg-white shadow-[0_2px_6px_rgba(22,20,15,0.18)]"
						style={{ left: `calc(11px + (100% - 22px) * ${fill / 100})` }}
					/>
				</div>
			</div>
			{marks ? (
				<div className="flex justify-between text-xs text-product-muted">
					{marks.map((mark) => (
						<span key={mark}>{mark}</span>
					))}
				</div>
			) : null}
		</div>
	);
}

/** One "Use glass on" surface: a 16px checkbox drawn inside a pill, ticked. */
function GlassPill({ children }: { children: ReactNode }) {
	return (
		<span className="inline-flex h-9 items-center gap-2 whitespace-nowrap rounded-full border-[1.5px] border-product-primary-accent bg-product-primary-soft pl-2.5 pr-3.5 text-[13.5px] font-semibold text-product-foreground">
			<span className="grid h-4 w-4 shrink-0 place-items-center rounded-[5px] border-[1.5px] border-product-primary bg-product-primary text-product-foreground">
				<Check aria-hidden="true" className="h-3 w-3" strokeWidth={3.2} />
			</span>
			{children}
		</span>
	);
}

/** The Background card and the Style card, which carries the glass controls. */
export function BackgroundGlassScreen() {
	return (
		<Screen
			caption="The builder's Appearance tab scrolled to the Background card and the Style card, showing the gradient picker above the glass level, the surface pills and the open fine-tune sliders."
			height={1720}
			legend={[
				"Turn on a custom background; everything below only appears once this is on.",
				"Choose a photo, a gradient or a single colour.",
				"Pick one of the twelve gradients; the chosen one gets an amber ring.",
				"Set how frosted the surfaces are, from Off to Frosted.",
				"Choose which surfaces the glass applies to.",
				"Open Fine-tune to adjust opacity, frost and splay by hand.",
			]}
			width={440}
		>
			<div className="absolute inset-0 border-l border-product-border bg-product-background">
				<div className="space-y-4 p-4">
					<PanelCard title="Background">
						<div className="space-y-5">
							<div className="flex min-h-11 items-center justify-between gap-3">
								<span className="text-[13.5px] font-semibold leading-snug text-product-foreground">
									Customize background
								</span>
								<span className="relative inline-flex h-[26px] w-11 shrink-0 items-center rounded-full border-[3px] border-transparent bg-product-primary-accent">
									<SpotMarker n={1} />
									<span className="block h-5 w-5 translate-x-[18px] rounded-full bg-white shadow-[0_1px_3px_rgba(22,20,15,0.25)]" />
								</span>
							</div>

							<div className="relative grid grid-cols-3 gap-1 rounded-[14px] border border-product-border bg-product-background-hero p-1">
								<SpotMarker n={2} />
								{BACKGROUND_TYPES.map(({ icon: Icon, label }) => (
									<span
										className={cn(
											"inline-flex h-10 items-center justify-center gap-1.5 rounded-[10px] text-[13px] font-semibold text-product-foreground-accent",
											label === "Gradient" &&
												"bg-product-card text-product-foreground shadow-[0_1px_2px_rgba(22,20,15,0.1),0_0_0_1px_rgb(var(--product-border-rgb))]",
										)}
										key={label}
									>
										<Icon aria-hidden="true" className="h-4 w-4" />
										{label}
									</span>
								))}
							</div>

							<ul className="grid grid-cols-[repeat(auto-fill,minmax(82px,1fr))] gap-2.5">
								{BACKGROUND_GRADIENTS.map((gradient) => {
									const on = gradient.key === "oat";
									return (
										<li key={gradient.key}>
											<span className="flex w-full flex-col gap-1.5 text-left">
												<span
													className={cn(
														"relative flex aspect-[4/3] w-full items-center justify-center rounded-xl border border-product-border-strong",
														on &&
															"shadow-[0_0_0_2px_rgb(var(--product-card-rgb)),0_0_0_4px_rgb(var(--product-primary-accent-rgb))]",
													)}
													style={{ background: gradient.css }}
												>
													{on ? (
														<>
															<SpotMarker n={3} />
															<Check
																aria-hidden="true"
																className="h-[18px] w-[18px] stroke-[3] text-[#2a1f14]"
															/>
														</>
													) : null}
												</span>
												<span className="truncate text-xs font-medium text-product-foreground-accent">
													{gradient.name}
												</span>
											</span>
										</li>
									);
								})}
							</ul>
						</div>
					</PanelCard>

					<PanelCard title="Style">
						<div className="space-y-5">
							<div className="space-y-5">
								<div className="space-y-2">
									<FieldLabel>Font style</FieldLabel>
									<span className="flex h-11 w-full items-center justify-between gap-2 rounded-[14px] border-[1.5px] border-product-border-strong bg-product-card px-4 text-[15px] text-product-foreground">
										Inter
										<ChevronDown
											aria-hidden="true"
											className="h-4 w-4 shrink-0 text-product-muted"
										/>
									</span>
								</div>

								<SliderField
									fill={50}
									label="Content font size"
									marks={["Small", "Medium", "Large"]}
									value="medium"
								/>
								<SliderField fill={75} label="Corner radius" value="12px" />
								<SliderField
									fill={33.33}
									label="Shadow"
									marks={["None", "High"]}
									value="low"
								/>
							</div>

							<div className="space-y-5 border-t border-product-border pt-4">
								<div className="relative">
									<SpotMarker className="-left-2 top-[22px]" n={4} />
									<SliderField
										fill={66.67}
										info
										label="Glass effect"
										marks={["Off", "Clear", "Semi", "Frosted"]}
										value="Semi-frosted"
									/>
								</div>

								<div className="relative space-y-2">
									<SpotMarker className="-left-2 top-[18px]" n={5} />
									<p className="mb-2 text-[13.5px] font-semibold leading-none text-product-foreground">
										Use glass on
									</p>
									<div className="flex flex-wrap gap-2">
										{GLASS_TARGETS.map(({ key, label }) => (
											<GlassPill key={key}>{label}</GlassPill>
										))}
									</div>
								</div>

								<div className="relative">
									<SpotMarker n={6} />
									<div className="flex min-h-11 w-full items-center gap-3 border-t border-product-border px-0.5 text-[13.5px] font-semibold text-product-foreground">
										Fine-tune
										<small className="ml-auto truncate text-[12.5px] font-medium text-product-muted">
											Opacity 55% &middot; Frost 8px &middot; Splay 8px
										</small>
										<ChevronDown
											aria-hidden="true"
											className="h-4 w-4 shrink-0 rotate-180 text-product-muted"
										/>
									</div>

									<div className="space-y-4 pt-1.5">
										<div>
											<SliderField
												fill={53.85}
												label="Opacity"
												marks={["See-through", "Solid"]}
												value="55%"
											/>
											<p className={hintClass}>
												Lower lets more of the page show through.
											</p>
										</div>
										<div>
											<SliderField
												fill={20}
												label="Frost"
												marks={["Sharp", "Soft"]}
												value="8px"
											/>
											<p className={hintClass}>
												Blur of what&apos;s behind, like content scrolling under
												the navbar. Phones cap it at 20 px.
											</p>
										</div>
										<div>
											<SliderField
												fill={33.33}
												label="Splay"
												marks={["Flat", "Thick"]}
												value="8px"
											/>
											<p className={hintClass}>
												Light along the edges. Past 16 px it starts to glow.
											</p>
										</div>
									</div>
								</div>
							</div>
						</div>
					</PanelCard>
				</div>
			</div>
		</Screen>
	);
}
