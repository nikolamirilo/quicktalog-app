import {
	ArrowRight,
	CalendarDays,
	Check,
	Minus,
	Settings,
	Star,
	Zap,
} from "lucide-react";

import { Screen, SpotMarker } from "@/components/manual/Screen";
import {
	AppNavbar,
	Btn,
	DashboardSidebar,
	PageWash,
	Panel,
	SectionTitle,
	StatusPill,
} from "@/components/manual/screens/kit";
import { cn } from "@/lib/ui/cn";

/**
 * The Subscription tab on the Starter plan: the upgrade strip, the plan card
 * (identity, price and cycle, the billing portal strip) and Plan Features.
 * The usage gauges are not here; they are the separate Usage tab.
 */

/** The two cells of the price block, in the order the tab renders them. */
const details: [string, string][] = [
	["Price", "$0"],
	["Subscription Cycle", "Yearly"],
];

/** Starter's limits, as figures, five across at this width. */
const limits: [string, string][] = [
	["Catalogues", "1"],
	["Sections per catalogue", "5"],
	["Items per catalogue", "15"],
	["Page views / month", "500"],
	["AI credits / month", "15"],
];

type FeatureRow = { included: boolean; label: string; value?: string };

/** What Starter includes, by area. A value only shows on an included row. */
const featureGroups: { rows: FeatureRow[]; title: string }[] = [
	{
		rows: [
			{ included: true, label: "Standard themes" },
			{ included: false, label: "Advanced styling" },
			{ included: false, label: "Custom branding" },
		],
		title: "Design",
	},
	{
		rows: [
			{ included: true, label: "Items" },
			{ included: true, label: "Text" },
			{ included: false, label: "Divider" },
			{ included: false, label: "External content" },
			{ included: false, label: "Custom visual" },
		],
		title: "Section types",
	},
	{
		rows: [
			{ included: true, label: "Analytics", value: "Basic" },
			{ included: false, label: "Your own analytics tags" },
			{ included: false, label: "Newsletter sign-ups" },
			{ included: true, label: "Support", value: "Email support" },
			{ included: false, label: "Custom features" },
		],
		title: "Growth & support",
	},
];

/** One row of a feature list: the marker, the label, and its value if any. */
function FeatureLine({ included, label, value }: FeatureRow) {
	return (
		<li className="flex min-h-9 items-center gap-x-2.5 py-1.5 text-sm">
			{included ? (
				<span className="grid h-5 w-5 flex-none place-items-center rounded-full bg-product-primary text-product-foreground">
					<Check className="h-3 w-3" strokeWidth={3.2} />
				</span>
			) : (
				<span className="grid h-5 w-5 flex-none place-items-center rounded-full bg-product-background-hero text-product-muted">
					<Minus className="h-3 w-3" />
				</span>
			)}
			<span
				className={cn(
					"min-w-0 flex-1",
					included
						? "font-medium text-product-foreground"
						: "text-product-muted",
				)}
			>
				{label}
			</span>
			{value ? (
				<span className="ml-auto text-right text-xs font-semibold text-product-foreground-accent">
					{value}
				</span>
			) : null}
		</li>
	);
}

/** The dashboard Subscription tab, on the free Starter plan. */
export function SubscriptionScreen() {
	return (
		<Screen
			caption="The Subscription tab: the plan you are on, what it costs, the button to your billing portal, and everything the plan includes."
			height={1100}
			legend={[
				"The Subscription tab in your dashboard sidebar",
				"A strip offering the next plan up",
				"Starts the checkout for a bigger plan",
				"The plan you are on today",
				"What you pay, and how often you are billed",
				"Invoices, card details and cancelling, greyed out on the free Starter plan",
			]}
			title="quicktalog.app/admin/dashboard?tab=subscription"
			width={1280}
		>
			<PageWash>
				<AppNavbar />
				<div className="absolute inset-x-0 top-[120px] mx-auto flex max-w-[1280px] items-start gap-7 px-8">
					<div className="relative">
						<SpotMarker className="-left-2 top-[78px]" n={1} />
						<DashboardSidebar active="Subscription" />
					</div>

					<Panel>
						<p className="mb-[18px] flex items-center gap-3 font-product-heading text-[32px] font-extrabold leading-[1.15] tracking-[-0.025em] text-product-foreground">
							<CalendarDays className="h-7 w-7 flex-none text-product-primary-ink" />
							Subscription Overview
						</p>

						<div className="relative mb-[18px] flex items-center gap-x-4 rounded-product-card border border-product-primary/50 bg-[linear-gradient(120deg,var(--product-primary-soft),var(--product-card)_80%)] px-[18px] py-4">
							<SpotMarker n={2} />
							<span className="grid h-10 w-10 flex-none place-items-center rounded-full bg-product-primary text-product-foreground">
								<Star className="h-[19px] w-[19px]" />
							</span>
							<div className="min-w-0 flex-1">
								<p className="font-product-heading text-[15.5px] font-bold leading-snug text-product-foreground">
									Upgrade your plan
								</p>
								<p className="mt-0.5 text-sm text-product-foreground-accent">
									Get more features, higher limits, and premium support.
								</p>
							</div>
							<span className="relative flex-none">
								<SpotMarker n={3} />
								<Btn>
									<Star />
									Upgrade plan
								</Btn>
							</span>
						</div>

						<div className="mb-[18px] flex flex-col gap-4 rounded-product-card border border-product-border bg-product-card p-6 shadow-product">
							<div className="relative flex items-start gap-x-3.5">
								<SpotMarker n={4} />
								<span className="grid h-12 w-12 flex-none place-items-center rounded-[15px] bg-product-primary text-product-foreground shadow-product-primary">
									<Zap className="h-[22px] w-[22px]" />
								</span>
								<div className="min-w-0 flex-1">
									<p className="font-product-heading text-xl font-bold leading-tight tracking-[-0.02em] text-product-foreground">
										Starter
									</p>
									<p className="text-sm text-product-foreground-accent">
										Perfect for individuals and small businesses getting
										started.
									</p>
								</div>
								<StatusPill status="Active" />
							</div>

							<div className="relative">
								<SpotMarker
									className="-left-2 top-1/2 -translate-y-1/2"
									n={5}
								/>
								<dl className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-product-border bg-product-border">
									{details.map(([label, value]) => (
										<div
											className="min-w-0 bg-product-card px-3.5 py-3"
											key={label}
										>
											<dt className="text-[12.5px] font-semibold text-product-muted">
												{label}
											</dt>
											<dd className="mt-0.5 font-product-heading text-[15px] font-bold leading-snug text-product-foreground">
												{value}
											</dd>
										</div>
									))}
								</dl>
							</div>

							<div className="flex items-center justify-between gap-3 rounded-2xl border border-product-border bg-product-background px-4 py-3.5">
								<div className="flex-1">
									<p className="text-[15px] font-bold text-product-foreground">
										Manage your subscription
									</p>
									<p className="text-sm text-product-foreground-accent">
										Update billing details, check transactions or cancel
										subscription.
									</p>
								</div>
								<span className="relative flex-none">
									<SpotMarker n={6} />
									<Btn className="opacity-50" variant="outline">
										<Settings />
										Manage subscription
									</Btn>
								</span>
							</div>
						</div>

						<div className="rounded-product-card border border-product-border bg-product-card p-6 shadow-product">
							<div className="mb-4 flex items-center justify-between gap-2">
								<SectionTitle icon={Star}>Plan Features</SectionTitle>
								<span className="inline-flex items-center gap-1 text-sm font-semibold text-product-primary-ink">
									Compare plans
									<ArrowRight className="h-4 w-4" />
								</span>
							</div>

							<dl className="grid grid-cols-5 gap-2">
								{limits.map(([label, value]) => (
									<div
										className="min-w-0 rounded-[14px] bg-product-background-hero px-3.5 py-3"
										key={label}
									>
										<dt className="text-xs font-medium text-product-foreground-accent">
											{label}
										</dt>
										<dd className="mt-0.5 break-words font-product-heading text-xl font-extrabold tabular-nums text-product-foreground">
											{value}
										</dd>
									</div>
								))}
							</dl>

							<div className="mt-5 grid grid-cols-3 gap-x-8">
								{featureGroups.map((group) => (
									<div key={group.title}>
										<p className="mb-1.5 text-xs font-bold text-product-muted">
											{group.title}
										</p>
										<ul className="divide-y divide-product-border">
											{group.rows.map((row) => (
												<FeatureLine
													included={row.included}
													key={row.label}
													label={row.label}
													value={row.value}
												/>
											))}
										</ul>
									</div>
								))}
							</div>
						</div>
					</Panel>
				</div>
			</PageWash>
		</Screen>
	);
}
