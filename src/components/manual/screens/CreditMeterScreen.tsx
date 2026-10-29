import { ArrowUp, ChevronDown, CornerDownLeft, ImagePlus } from "lucide-react";

import { Screen, SpotMarker } from "@/components/manual/Screen";

/** Starter's allowance for one period, and what this drawing has spent of it. */
const LIMIT = 15;
const USED = 6;

/** The four one-click asks, in the order the panel lists them. */
const suggestions = [
	"Add a new section with 6 items",
	"Make every description shorter and friendlier",
	"Raise every price by 10%",
	"Switch the theme to something more elegant",
];

/** The Quick AI mark: a "Q" ring whose tail is a sparkle, plus a detached dot. */
function QuickAiMark() {
	return (
		<svg aria-hidden="true" className="h-5 w-5" fill="none" viewBox="0 0 24 24">
			<title>Quick AI</title>
			<circle
				cx="10.5"
				cy="10.5"
				r="6.75"
				stroke="currentColor"
				strokeWidth="2.5"
			/>
			<path
				d="M18 13.5c.35 2.45 1.6 3.7 4.05 4.05-2.45.35-3.7 1.6-4.05 4.05-.35-2.45-1.6-3.7-4.05-4.05 2.45-.35 3.7-1.6 4.05-4.05Z"
				fill="currentColor"
			/>
			<circle cx="19.25" cy="3.75" fill="currentColor" r="1.25" />
		</svg>
	);
}

/**
 * The credit ring: a grey track with the share already spent drawn over it in
 * deep navy, from the top and clockwise, with both ends rounded. One drawing
 * serves the 18px ring in the header and the 96px one in the popover, because
 * the product builds both from the same component.
 */
function CreditRing({
	size,
	strokeWidth,
}: {
	size: number;
	strokeWidth: number;
}) {
	const radius = (size - strokeWidth) / 2;
	const circumference = 2 * Math.PI * radius;
	const middle = size / 2;

	return (
		<svg
			aria-hidden="true"
			height={size}
			viewBox={`0 0 ${size} ${size}`}
			width={size}
		>
			<title>AI credit usage</title>
			<circle
				className="text-product-border"
				cx={middle}
				cy={middle}
				fill="none"
				r={radius}
				stroke="currentColor"
				strokeWidth={strokeWidth}
			/>
			<circle
				className="text-product-secondary"
				cx={middle}
				cy={middle}
				fill="none"
				r={radius}
				stroke="currentColor"
				strokeDasharray={circumference}
				strokeDashoffset={circumference * (1 - USED / LIMIT)}
				strokeLinecap="round"
				strokeWidth={strokeWidth}
				transform={`rotate(-90 ${middle} ${middle})`}
			/>
		</svg>
	);
}

/** The AI credit ring in the Quick AI header, with its popover open. */
export function CreditMeterScreen() {
	return (
		<Screen
			caption="The Quick AI panel in the builder with the credit ring selected, showing the credits left this period and what a change costs."
			height={700}
			legend={[
				"The credit ring sits in the Quick AI header. Select it to open the details",
				"The arc fills clockwise from the top with the share of this period's credits already spent",
				"The big number is credits remaining, not credits used",
				"The exact count against your plan's allowance for the period",
				"At 75% used an amber note appears here, and a red one once you run out",
				"What a turn costs: a question is free, a change costs 2 plus one per extra task",
			]}
			width={440}
		>
			<div className="absolute inset-0 bg-product-background-hero">
				<div className="absolute left-[10px] top-[28px] flex h-[640px] w-[420px] flex-col overflow-hidden rounded-product-card border border-product-border bg-product-card font-product-body shadow-product-hover">
					<div className="flex shrink-0 items-center justify-between gap-2 border-b border-product-border bg-product-card py-2 pl-4 pr-2">
						<div className="flex min-w-0 items-center gap-3">
							<span className="flex h-9 w-9 flex-none items-center justify-center rounded-full border border-product-primary/35 bg-product-primary-soft text-product-primary-ink">
								<QuickAiMark />
							</span>
							<span className="min-w-0">
								<span className="block truncate font-product-heading text-[15px] font-bold leading-tight tracking-[-0.025em] text-product-foreground">
									Quick AI
								</span>
								<span className="block truncate text-xs leading-tight text-product-muted">
									Ask for any change to this catalogue
								</span>
							</span>
						</div>
						<div className="flex flex-none items-center">
							<span className="relative grid h-9 w-9 place-items-center rounded-full">
								<SpotMarker n={1} />
								<CreditRing size={18} strokeWidth={3} />
							</span>
							<span className="grid h-9 w-9 place-items-center rounded-full text-product-foreground-accent">
								<ChevronDown className="h-[18px] w-[18px]" />
							</span>
						</div>
					</div>

					<div className="flex-1 bg-product-background px-4 py-4">
						<div className="space-y-5 pt-1">
							<div className="grid gap-1.5">
								<p className="font-product-heading text-base font-extrabold leading-tight tracking-[-0.025em] text-product-foreground">
									What should we change?
								</p>
								<p className="text-sm leading-relaxed text-product-foreground-accent">
									Describe it in your own words - add or remove sections and
									items, rewrite text, adjust prices or restyle the whole
									catalogue. Attach or paste photos of a printed menu or price
									list and it will read them for you.
								</p>
								<p className="text-sm leading-relaxed text-product-foreground-accent">
									Tip: the more detail you give - item names, prices, sizes and
									the order you want them in - the better the result.
								</p>
							</div>

							<div className="space-y-2">
								<p className="text-xs font-semibold text-product-muted">
									Try one of these
								</p>
								<div className="grid gap-2">
									{suggestions.map((suggestion) => (
										<span
											className="flex min-h-11 items-center gap-2.5 rounded-xl border border-product-border bg-product-card px-3.5 py-2.5 text-sm font-medium text-product-foreground"
											key={suggestion}
										>
											<ArrowUp className="h-4 w-4 flex-none text-product-primary-ink" />
											{suggestion}
										</span>
									))}
								</div>
							</div>
						</div>
					</div>

					<div className="shrink-0 border-t border-product-border bg-product-card p-3">
						<div className="flex items-end gap-1.5 rounded-2xl border-[1.5px] border-product-border-strong bg-product-card p-1.5">
							<span className="flex h-10 w-10 flex-none items-center justify-center rounded-full text-product-foreground-accent">
								<ImagePlus className="h-[18px] w-[18px]" />
							</span>
							<span className="min-w-0 flex-1 px-1.5 py-2.5 text-[15px] leading-relaxed text-product-muted">
								Describe the change you want&#8230;
							</span>
							<span className="grid h-10 w-10 flex-none place-items-center rounded-full bg-product-primary text-product-foreground opacity-50">
								<ArrowUp className="h-[17.6px] w-[17.6px]" />
							</span>
						</div>
						<p className="mt-2 text-center text-[11px] leading-relaxed text-product-muted">
							<span className="inline-flex items-center gap-1 align-middle">
								<CornerDownLeft className="h-3 w-3" />
								Enter to send
								<span className="mx-1.5">&middot;</span>
							</span>
							Changes apply to the builder - review them, then save
						</p>
					</div>
				</div>

				{/*
				 * The popover is portalled out of the panel, so it hangs off the
				 * header rule: 8px under the ring, its right edge lined up with the
				 * ring's, and no arrow and no dimming behind it.
				 */}
				<div className="absolute left-[129px] top-[81px] z-30 w-64 rounded-[20px] border border-product-border bg-product-card p-4 font-product-body text-product-foreground shadow-product-hover">
					<div className="flex flex-col items-center gap-3 text-center">
						<span className="relative flex h-24 w-24 items-center justify-center">
							<SpotMarker className="-left-2 top-1/2 -translate-y-1/2" n={2} />
							<CreditRing size={96} strokeWidth={9} />
							<span className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center">
								<SpotMarker
									className="-top-[19px] left-1/2 -translate-x-1/2"
									n={3}
								/>
								<span className="font-product-heading text-xl font-extrabold tabular-nums text-product-foreground">
									{LIMIT - USED}
								</span>
								<span className="text-[11px] leading-none text-product-muted">
									left
								</span>
							</span>
						</span>

						<div className="relative space-y-0.5">
							<SpotMarker className="-left-7 top-1/2 -translate-y-1/2" n={4} />
							<p className="font-product-heading text-sm font-bold text-product-foreground">
								AI credits
							</p>
							<p className="text-xs tabular-nums text-product-foreground-accent">
								{USED} of {LIMIT} used
							</p>
						</div>

						{/* The empty slot the amber or red note fills once you pass 75%. */}
						<span className="relative -my-3 block h-3 w-full">
							<SpotMarker className="-top-1 left-auto right-4" n={5} />
						</span>

						<p className="relative text-xs leading-relaxed text-product-foreground-accent">
							<SpotMarker className="-bottom-2 -left-2 top-auto" n={6} />A
							question is free. A change costs 2 plus one per extra task. Resets
							every 30 days.
						</p>
					</div>
				</div>
			</div>
		</Screen>
	);
}
