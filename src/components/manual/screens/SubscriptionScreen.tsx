import {
	CalendarDays,
	ChartColumn,
	ExternalLink,
	Sparkles,
} from "lucide-react";

import { Screen, SpotMarker } from "@/components/manual/Screen";
import {
	AppNavbar,
	Btn,
	DashboardSidebar,
	PageWash,
	Panel,
	SectionTitle,
} from "@/components/manual/screens/kit";

function Meter({
	label,
	used,
	limit,
	percent,
	icon: Icon,
	spot,
}: {
	label: string;
	used: string;
	limit: string;
	percent: number;
	icon: typeof ChartColumn;
	spot?: number;
}) {
	return (
		<div className="relative rounded-[16px] border border-product-border bg-product-card p-4">
			{spot ? <SpotMarker n={spot} /> : null}
			<div className="flex items-center gap-2">
				<Icon className="h-4 w-4 text-product-primary-ink" />
				<span className="text-[13px] font-semibold text-product-foreground">
					{label}
				</span>
				<span className="ml-auto text-[12px] text-product-muted">
					{used} of {limit}
				</span>
			</div>
			<div className="mt-2.5 h-2 overflow-hidden rounded-full bg-product-background-hero">
				<div
					className="h-full rounded-full bg-product-primary"
					style={{ width: `${percent}%` }}
				/>
			</div>
		</div>
	);
}

/** The Subscription tab, with the usage meters underneath. */
export function SubscriptionScreen() {
	return (
		<Screen
			caption="The Subscription tab. Your plan is here; cancelling and invoices live behind Manage subscription."
			height={700}
			legend={[
				"A strip offering the next plan up",
				"The plan you are on today",
				"Start a checkout for a bigger plan",
				"Invoices, card details and cancelling",
				"How much of this month you have used",
			]}
			title="quicktalog.app/admin/dashboard?tab=subscription"
			width={1280}
		>
			<PageWash>
				<AppNavbar />
				<div className="absolute inset-x-0 top-[96px] mx-auto flex max-w-[1280px] items-start gap-7 px-5">
					<DashboardSidebar active="Subscription" />
					<Panel>
						<SectionTitle icon={CalendarDays}>
							Subscription Overview
						</SectionTitle>

						<div className="relative mt-4 flex items-center gap-4 rounded-product-card border border-product-primary/45 bg-product-amber-panel p-4">
							<SpotMarker n={1} />
							<div className="min-w-0 flex-1">
								<p className="text-[15px] font-bold text-product-foreground">
									Upgrade your plan
								</p>
								<p className="text-[13px] text-product-foreground-accent">
									Get more features, higher limits, and premium support.
								</p>
							</div>
							<span className="relative">
								<SpotMarker n={3} />
								<Btn>Upgrade plan</Btn>
							</span>
						</div>

						<div className="relative mt-4 rounded-product-card border border-product-border bg-product-card p-5">
							<SpotMarker n={2} />
							<p className="text-[12px] font-semibold uppercase tracking-[0.04em] text-product-muted">
								Current plan
							</p>
							<p className="mt-1 font-product-heading text-[26px] font-extrabold text-product-foreground">
								Starter
							</p>
							<p className="mt-1 text-[13px] text-product-foreground-accent">
								1 catalogue &middot; 5 sections &middot; 15 items &middot; 500
								page views a month &middot; 15 AI credits
							</p>
							<div className="relative mt-4">
								<SpotMarker n={4} />
								<Btn variant="outline">
									Manage subscription
									<ExternalLink />
								</Btn>
							</div>
						</div>

						<div className="mt-5">
							<p className="mb-2.5 text-[15px] font-bold text-product-foreground">
								This month
							</p>
							<div className="relative grid grid-cols-2 gap-3">
								<SpotMarker n={5} />
								<Meter
									icon={ChartColumn}
									label="Traffic"
									limit="500"
									percent={42}
									used="212"
								/>
								<Meter
									icon={Sparkles}
									label="AI Credits"
									limit="15"
									percent={60}
									used="9"
								/>
							</div>
						</div>
					</Panel>
				</div>
			</PageWash>
		</Screen>
	);
}
