import type { OverallAnalytics as OverallAnalyticsType } from "@quicktalog/common";
import { Eye, Info, LayoutGrid, Mail, Users } from "lucide-react";
import type { ReactNode } from "react";

import { IconTile } from "@/components/general/IconTile";

export type StatMetric = "views" | "visitors" | "catalogues" | "newsletter";

export const STAT_EXPLAINERS: Record<
	StatMetric,
	{ title: string; text: string }
> = {
	views: {
		title: "Total Views",
		text: "This shows the total number of times your catalogues have been viewed by visitors. It includes all page visits across all your catalogues.",
	},
	visitors: {
		title: "Total Visitors",
		text: "This represents the number of individuals who have visited your catalogues. Each person is counted only once per day, regardless of how many times they visit your catalogue on that day.",
	},
	catalogues: {
		title: "Catalogues",
		text: "This displays the total number of catalogues you have created. Each catalogue represents a different business or service offering.",
	},
	newsletter: {
		title: "Newsletter",
		text: "This shows how many people have subscribed to your newsletter service. These are users who have opted in to receive updates from you.",
	},
};

function StatCard({
	label,
	value,
	icon,
	onInfo,
}: {
	label: string;
	value: number | undefined;
	icon: ReactNode;
	onInfo: () => void;
}) {
	return (
		<article className="flex min-w-0 flex-col gap-3 rounded-product-card border border-product-border bg-product-card p-3.5 shadow-product sm:p-4 md:p-5">
			<div className="flex items-center gap-1.5 sm:gap-2">
				{/* Two cards per row on a phone: every pixel here is width the name needs. */}
				<IconTile
					className="h-8 w-8 rounded-[10px] sm:h-9 sm:w-9 sm:rounded-[11px]"
					size="sm"
				>
					{icon}
				</IconTile>
				<h3 className="min-w-0 flex-1 pr-1 font-product-body text-[12.5px] font-semibold leading-snug text-product-foreground-accent sm:text-[13.5px]">
					{label}
				</h3>
				<button
					aria-label={`About ${label}`}
					className="-mr-1 grid h-6 w-6 flex-none place-items-center rounded-full text-product-muted transition-colors hover:bg-product-background-hero hover:text-product-foreground sm:-mr-1.5 sm:h-7 sm:w-7"
					onClick={onInfo}
					type="button"
				>
					<Info aria-hidden="true" className="size-[14px] sm:size-[15px]" />
				</button>
			</div>
			{/* Bottom-aligned, so a name that wraps to two lines leaves the numbers in a row level with each other. */}
			<p className="mt-auto font-product-heading text-[26px] font-extrabold leading-none tracking-[-0.03em] tabular-nums [overflow-wrap:anywhere] sm:text-[32px] md:text-[38px]">
				{Number(value ?? 0).toLocaleString("en-US")}
			</p>
		</article>
	);
}

export const OverallAnalytics = ({
	onInfo,
	overallAnalytics,
}: {
	onInfo: (metric: StatMetric) => void;
	overallAnalytics: OverallAnalyticsType;
}) => {
	return (
		<div className="grid grid-cols-2 gap-3 min-[1100px]:grid-cols-4 min-[1100px]:gap-4">
			<StatCard
				icon={<Eye />}
				label="Total Views"
				onInfo={() => onInfo("views")}
				value={overallAnalytics.totalPageViews}
			/>
			<StatCard
				icon={<Users />}
				label="Total Visitors"
				onInfo={() => onInfo("visitors")}
				value={overallAnalytics.totalUniqueVisitors}
			/>
			<StatCard
				icon={<LayoutGrid />}
				label="Catalogues"
				onInfo={() => onInfo("catalogues")}
				value={overallAnalytics.totalServiceCatalogues}
			/>
			<StatCard
				icon={<Mail />}
				label="Newsletter"
				onInfo={() => onInfo("newsletter")}
				value={overallAnalytics.totalNewsletterSubscriptions}
			/>
		</div>
	);
};
