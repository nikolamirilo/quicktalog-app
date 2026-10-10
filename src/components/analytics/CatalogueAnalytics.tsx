import { AlertCircle } from "lucide-react";
import { AnalyticsControls } from "@/components/analytics/AnalyticsControls";
import { ByDayTable } from "@/components/analytics/ByDayTable";
import { KpiCards } from "@/components/analytics/KpiCards";
import { LineChart } from "@/components/charts/LineChart";
import { Eyebrow } from "@/components/general/Eyebrow";
import { Card } from "@/components/ui/card";
import {
	type CatalogueTraffic,
	formatDay,
	summarizeTraffic,
	type TrafficRange,
} from "@/lib/analytics/traffic";
import { kebabToTitle } from "@/lib/format/text";

type Props = {
	catalogue: string;
	catalogues: string[];
	range: TrafficRange;
	/** Null when PostHog could not be reached. */
	traffic: CatalogueTraffic | null;
};

export function CatalogueAnalytics({
	catalogue,
	catalogues,
	range,
	traffic,
}: Props) {
	const title = kebabToTitle(catalogue);

	return (
		<div className="min-w-0 pb-10 pt-1 text-product-foreground">
			<div className="mb-[18px] flex flex-col gap-4 min-[900px]:flex-row min-[900px]:items-end min-[900px]:justify-between">
				<div>
					<Eyebrow className="mb-1">Catalogue analytics</Eyebrow>
					<h1 className="text-[clamp(26px,3.2vw,34px)] font-extrabold tracking-[-0.03em]">
						Analytics for {title}
					</h1>
					<p className="mt-1.5 text-[15px] text-product-foreground-accent">
						Track your catalogue performance and visitor insights.
					</p>
				</div>
				<AnalyticsControls
					catalogue={catalogue}
					catalogues={catalogues}
					range={range}
				/>
			</div>

			{traffic ? (
				<TrafficReport traffic={traffic} />
			) : (
				<div
					className="flex items-start gap-3 rounded-product-card border border-product-error/25 bg-product-error-soft p-5"
					role="alert"
				>
					<AlertCircle
						aria-hidden="true"
						className="mt-0.5 h-5 w-5 shrink-0 text-product-error"
					/>
					<div>
						<h2 className="text-base font-bold">Error loading analytics</h2>
						<p className="mt-1 text-sm text-product-foreground-accent">
							Unable to load analytics data at this time. Please try again
							later.
						</p>
					</div>
				</div>
			)}
		</div>
	);
}

function TrafficReport({ traffic }: { traffic: CatalogueTraffic }) {
	const summary = summarizeTraffic(traffic);
	const points = traffic.current.map((day) => ({
		label: formatDay(day.date, { month: "short", day: "numeric" }),
		title: formatDay(day.date),
		value: day.views,
		detail: `${day.visitors.toLocaleString("en-US")} visitors`,
	}));

	return (
		<>
			<KpiCards range={traffic.range} summary={summary} />

			<Card
				aria-labelledby="analytics-chart-title"
				className="mb-3.5 p-[18px]"
				role="region"
			>
				<div className="mb-3.5 flex items-start justify-between gap-3">
					<div>
						<h2
							className="text-[17px] font-extrabold tracking-[-0.015em]"
							id="analytics-chart-title"
						>
							Traffic overview
						</h2>
						<p className="mt-0.5 text-[13px] text-product-muted">
							Daily page views over time
						</p>
					</div>
					<span className="inline-flex items-center gap-1.5 whitespace-nowrap text-[12.5px] font-semibold text-product-foreground-accent">
						<i
							aria-hidden="true"
							className="h-[3px] w-3.5 rounded-sm bg-product-chart"
						/>
						Page views
					</span>
				</div>
				<figure aria-describedby="analytics-chart-desc" className="m-0">
					<div aria-hidden="true">
						<LineChart data={points} name="Page views" unit="views" />
					</div>
					<figcaption className="sr-only" id="analytics-chart-desc">
						Line chart of daily page views for the last {traffic.range} days.
						The most recent days are listed in the table below.
					</figcaption>
				</figure>
			</Card>

			<ByDayTable busiest={summary.best.current} days={traffic.current} />
		</>
	);
}
