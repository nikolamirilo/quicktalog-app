import { RotateCcw, Sparkles, X } from "lucide-react";

import { Screen, SpotMarker } from "@/components/manual/Screen";

/** The credit ring in the Quick AI header, with its popover open. */
export function CreditMeterScreen() {
	return (
		<Screen
			caption="The credit ring in the Quick AI header, opened to show what is left this month."
			height={360}
			legend={[
				"The ring, which fills as you spend",
				"How many credits are left",
				"What you have used against your plan",
				"What an ask costs, and when it resets",
			]}
			width={420}
		>
			<div className="absolute inset-0 bg-product-card">
				<div className="flex items-center gap-2.5 border-b border-product-border px-4 py-3">
					<span className="grid h-8 w-8 place-items-center rounded-full bg-product-primary-soft">
						<Sparkles className="h-4 w-4 text-product-primary-ink" />
					</span>
					<span className="min-w-0 flex-1">
						<span className="block font-product-heading text-[14.5px] font-extrabold text-product-foreground">
							Quick AI
						</span>
						<span className="block text-[11.5px] text-product-muted">
							Ask for any change to this catalogue
						</span>
					</span>
					<span className="relative mr-1 grid h-[18px] w-[18px] place-items-center rounded-full border-[3px] border-product-primary border-r-product-border">
						<SpotMarker n={1} />
					</span>
					<RotateCcw className="h-4 w-4 text-product-muted" />
					<X className="h-4 w-4 text-product-muted" />
				</div>

				<div className="mx-4 mt-3 rounded-[16px] border border-product-border bg-product-card p-4 shadow-product-hover">
					<div className="flex items-center gap-4">
						<span className="relative grid h-[96px] w-[96px] flex-none place-items-center rounded-full border-[7px] border-product-primary border-r-product-background-hero border-t-product-background-hero">
							<SpotMarker n={2} />
							<span className="font-product-heading text-[26px] font-extrabold leading-none text-product-foreground">
								6
							</span>
							<span className="text-[11px] text-product-muted">left</span>
						</span>
						<div className="relative min-w-0 flex-1">
							<SpotMarker n={3} />
							<p className="font-product-heading text-[15px] font-extrabold text-product-foreground">
								AI credits
							</p>
							<p className="mt-0.5 text-[12.5px] text-product-foreground-accent">
								9 of 15 used
							</p>
							<span className="mt-2 inline-flex rounded-full bg-product-primary-soft px-2.5 py-1 text-[11px] font-semibold text-product-primary-ink">
								Running low - the assistant still works.
							</span>
						</div>
					</div>
					<p className="relative mt-3.5 border-t border-product-border pt-3 text-[11.5px] leading-[1.5] text-product-muted">
						<SpotMarker n={4} />A question is free. A change costs 2 plus one
						per extra task. Resets at the start of each month.
					</p>
				</div>
			</div>
		</Screen>
	);
}
