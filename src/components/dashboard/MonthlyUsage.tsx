"use client";
import type { PricingPlan, Usage } from "@quicktalog/common";
import { ChartColumn, Eye, LayoutGrid, Sparkles } from "lucide-react";
import type { ReactNode } from "react";

import { GaugeChart, getGaugeStatus } from "@/components/charts/GaugeChart";
import { AppLead, AppTitle } from "@/components/dashboard/common/AppHeadings";
import { IconTile } from "@/components/general/IconTile";
import { cn } from "@/lib/ui/cn";

type UsageMeter = {
	title: string;
	used: number;
	limit: number;
	unit: string;
	icon: ReactNode;
	shown: boolean;
};

function UsageCard({ meter }: { meter: UsageMeter }) {
	const status = getGaugeStatus(meter.used, meter.limit);

	return (
		<article
			className={cn(
				"flex flex-col items-center gap-1.5 rounded-product-card border bg-product-card p-5 text-center shadow-product",
				status === "normal" && "border-product-border",
				status === "warning" &&
					"border-product-primary/60 bg-[linear-gradient(180deg,var(--product-primary-soft),var(--product-card)_45%)]",
				status === "critical" &&
					"border-product-error/40 bg-[linear-gradient(180deg,var(--product-error-soft),var(--product-card)_45%)]",
			)}
		>
			<div className="flex w-full items-center gap-2.5 text-left">
				<IconTile size="sm">{meter.icon}</IconTile>
				<h2 className="flex-1 text-[16.5px] font-bold leading-snug tracking-[-0.015em]">
					{meter.title}
				</h2>
				{status === "warning" && (
					<span className="inline-flex h-6 items-center whitespace-nowrap rounded-full border border-product-primary/45 bg-product-primary-soft px-2.5 text-xs font-bold text-product-primary-ink">
						Near limit
					</span>
				)}
				{status === "critical" && (
					<span className="inline-flex h-6 items-center whitespace-nowrap rounded-full bg-product-error-soft px-2.5 text-xs font-bold text-product-error">
						{meter.used > meter.limit
							? `${(meter.used - meter.limit).toLocaleString("en-US")} ${meter.unit} over`
							: "Limit reached"}
					</span>
				)}
			</div>
			<GaugeChart
				label={meter.title}
				limit={meter.limit}
				unit={meter.unit}
				used={meter.used}
			/>
		</article>
	);
}

export const MonthlyUsage = ({
	usage,
	currentPlan,
}: {
	usage: Usage;
	currentPlan: PricingPlan;
}) => {
	const meters: UsageMeter[] = [
		{
			title: "Traffic",
			used: usage.traffic.pageviews,
			limit: currentPlan.features.traffic_limit,
			unit: "views",
			icon: <Eye />,
			shown: true,
		},
		{
			title: "Catalogues",
			used: usage.catalogues,
			limit: currentPlan.features.catalogues,
			unit: "catalogues",
			icon: <LayoutGrid />,
			shown: true,
		},
		{
			title: "AI Credits",
			used: usage.credits,
			limit: currentPlan.features.ai_credits,
			unit: "credits",
			icon: <Sparkles />,
			shown: currentPlan.features.ai_credits > 0,
		},
	];

	return (
		<div>
			<AppTitle icon={<ChartColumn />}>Usage Overview</AppTitle>
			<AppLead>
				Monitor your resource consumption and track usage across all features
			</AppLead>
			<section
				aria-label="Usage against your plan limits"
				className="grid gap-3.5 min-[900px]:grid-cols-3"
			>
				{meters
					.filter((meter) => meter.shown)
					.map((meter) => (
						<UsageCard key={meter.title} meter={meter} />
					))}
			</section>
		</div>
	);
};
