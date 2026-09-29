import type { PricingPlan } from "@quicktalog/common";
import { ArrowRight, Check, Minus, Star } from "lucide-react";
import Link from "next/link";

import { AppSectionTitle } from "@/components/dashboard/common/AppHeadings";
import { cn } from "@/lib/ui/cn";

type Features = PricingPlan["features"];

type Limit = { label: string; value: number | "unlimited" | undefined };

type FeatureRow = {
	label: string;
	/** `true`/`false` for on/off features, a string for tiered ones ("Basic"). */
	value: boolean | string;
};

const formatLimit = (value: Limit["value"]) => {
	if (value === "unlimited") return "Unlimited";
	if (value === undefined) return "–";
	return value.toLocaleString("en-US");
};

const limitsOf = (f: Features): Limit[] => [
	{ label: "Catalogues", value: f.catalogues },
	{ label: "Sections per catalogue", value: f.sections_per_catalogue },
	{ label: "Items per catalogue", value: f.items_per_catalogue },
	{ label: "Page views / month", value: f.traffic_limit },
	{ label: "AI credits / month", value: f.ai_credits },
];

const groupsOf = (f: Features): { title: string; rows: FeatureRow[] }[] => [
	{
		title: "Design",
		rows: [
			{ label: "Standard themes", value: f.apperance.standardThemes },
			{ label: "Custom themes", value: f.apperance.customThemes },
			{ label: "Style controls", value: f.apperance.styles },
			{ label: "Custom branding", value: f.branding },
		],
	},
	{
		title: "Section types",
		rows: [
			{ label: "Divider", value: f.sections.divider },
			{ label: "External content", value: f.sections.embedding },
			{ label: "Custom code", value: f.sections.customCode },
		],
	},
	{
		title: "Growth & support",
		rows: [
			{ label: "Analytics", value: f.analytics },
			{ label: "Newsletter sign-ups", value: f.newsletter },
			{ label: "Support", value: f.support },
			{ label: "Custom features", value: f.custom_features },
		],
	},
];

const isIncluded = (value: FeatureRow["value"]) =>
	typeof value === "string" ? value.toLowerCase() !== "not included" : value;

/** The current plan: its limits as figures, then what's included by area. */
export function PlanFeatures({ features }: { features: Features }) {
	const groups = groupsOf(features);
	const missingSome = groups.some((group) =>
		group.rows.some((row) => !isIncluded(row.value)),
	);

	return (
		<section
			aria-labelledby="plan-features-h"
			className="rounded-product-card border border-product-border bg-product-card p-5 shadow-product md:p-6"
		>
			<div className="mb-4 flex flex-wrap items-center justify-between gap-2">
				<AppSectionTitle icon={<Star />} id="plan-features-h">
					Plan Features
				</AppSectionTitle>
				{missingSome && (
					<Link
						className="inline-flex items-center gap-1 text-sm font-semibold text-product-primary-ink hover:underline"
						href="/pricing"
					>
						Compare plans
						<ArrowRight aria-hidden="true" className="size-4" />
					</Link>
				)}
			</div>

			<dl className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5 [&>*:last-child]:col-span-2 sm:[&>*:last-child]:col-span-1">
				{limitsOf(features).map(({ label, value }) => (
					<div
						className="rounded-[14px] bg-product-background-hero px-3.5 py-3"
						key={label}
					>
						<dt className="text-xs font-medium text-product-foreground-accent">
							{label}
						</dt>
						<dd className="mt-0.5 font-product-heading text-xl font-extrabold tabular-nums text-product-foreground">
							{formatLimit(value)}
						</dd>
					</div>
				))}
			</dl>

			<div className="mt-5 grid gap-x-8 gap-y-5 md:grid-cols-3">
				{groups.map((group) => (
					<div key={group.title}>
						<h3 className="mb-1.5 text-xs font-bold uppercase tracking-[0.06em] text-product-muted">
							{group.title}
						</h3>
						<ul className="divide-y divide-product-border">
							{group.rows.map(({ label, value }) => {
								const included = isIncluded(value);
								return (
									<li
										className="flex min-h-9 items-center gap-2.5 py-1.5 text-sm"
										key={label}
									>
										{included ? (
											<span className="grid size-5 flex-none place-items-center rounded-full bg-product-primary text-product-foreground">
												<Check
													aria-hidden="true"
													className="size-3"
													strokeWidth={3.2}
												/>
											</span>
										) : (
											<span className="grid size-5 flex-none place-items-center rounded-full bg-product-background-hero text-product-muted">
												<Minus aria-hidden="true" className="size-3" />
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
										{typeof value === "string" && included ? (
											<span className="text-right text-xs font-semibold text-product-foreground-accent">
												{value}
											</span>
										) : (
											<span className="sr-only">
												{included ? "Included" : "Not included"}
											</span>
										)}
									</li>
								);
							})}
						</ul>
					</div>
				))}
			</div>
		</section>
	);
}
