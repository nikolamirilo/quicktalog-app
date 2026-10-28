import { ArrowUp, ChevronDown, CornerDownLeft, ImagePlus } from "lucide-react";

import { Screen, SpotMarker } from "@/components/manual/Screen";

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
 * The 18px credit ring in the header: a grey track with the used share drawn in
 * deep navy, starting at the top and going clockwise. Here 15 of 50 credits.
 */
function CreditRing() {
	return (
		<svg aria-hidden="true" className="h-[18px] w-[18px]" viewBox="0 0 18 18">
			<title>AI credits</title>
			<circle
				className="text-product-border"
				cx="9"
				cy="9"
				fill="none"
				r="7.5"
				stroke="currentColor"
				strokeWidth="3"
			/>
			<circle
				className="text-product-secondary"
				cx="9"
				cy="9"
				fill="none"
				r="7.5"
				stroke="currentColor"
				strokeDasharray="47.12"
				strokeDashoffset="32.98"
				strokeLinecap="round"
				strokeWidth="3"
				transform="rotate(-90 9 9)"
			/>
		</svg>
	);
}

/** The Quick AI panel as it opens, before you have asked anything. */
export function QuickAiScreen() {
	return (
		<Screen
			caption="The Quick AI chat panel as it first opens in the builder: a 420 by 640 floating card with its header, an empty state over four one click asks, and a composer whose send button is still greyed out."
			height={660}
			legend={[
				"Quick AI's name and what it does: ask for any change to this catalogue",
				"The AI credits you have left this month. Select the ring for the full breakdown",
				"Minimize the panel. Your conversation is kept",
				"What you can ask for, in your own words, and a tip on giving detail",
				"Four ready made asks. Selecting one sends it straight away",
				"Attach or paste photos, type your change, then send. The send button wakes up once you type",
			]}
			width={440}
		>
			<div className="absolute inset-0 bg-product-background-hero">
				<div className="absolute left-[10px] top-[10px] flex h-[640px] w-[420px] flex-col overflow-hidden rounded-product-card border border-product-border bg-product-card font-product-body shadow-product-hover">
					<div className="flex shrink-0 items-center justify-between gap-2 border-b border-product-border bg-product-card py-2 pl-4 pr-2">
						<div className="relative flex min-w-0 items-center gap-3">
							<SpotMarker className="-left-1.5 -top-1.5" n={1} />
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
								<SpotMarker n={2} />
								<CreditRing />
							</span>
							<span className="relative grid h-9 w-9 place-items-center rounded-full text-product-foreground-accent">
								<SpotMarker n={3} />
								<ChevronDown className="h-[18px] w-[18px]" />
							</span>
						</div>
					</div>

					<div className="flex-1 bg-product-background px-4 py-4">
						<div className="space-y-5 pt-1">
							<div className="relative grid gap-1.5">
								<SpotMarker className="-right-2 -top-1 left-auto" n={4} />
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
								<div className="relative grid gap-2">
									<SpotMarker n={5} />
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
						<div className="relative flex items-end gap-1.5 rounded-2xl border-[1.5px] border-product-border-strong bg-product-card p-1.5">
							<SpotMarker n={6} />
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
			</div>
		</Screen>
	);
}
