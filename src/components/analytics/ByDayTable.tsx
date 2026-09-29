import { Card } from "@/components/ui/card";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { formatDay, type TrafficDay } from "@/lib/analytics/traffic";

const ROWS = 10;

/**
 * The last days of the period, newest first: the chart's accessible twin.
 * "Busiest" and the bar scale use the whole period's busiest day, which may
 * be older than the rows shown.
 */
export function ByDayTable({
	days,
	busiest,
}: {
	days: TrafficDay[];
	/** The period's busiest day, from `summarizeTraffic`. */
	busiest: TrafficDay | null;
}) {
	const rows = days.slice(-ROWS).reverse();
	const max = busiest?.views ?? 0;

	return (
		<Card aria-labelledby="analytics-by-day" className="p-[18px]" role="region">
			<div className="mb-3.5">
				<h2
					className="text-[17px] font-extrabold tracking-[-0.015em]"
					id="analytics-by-day"
				>
					By day
				</h2>
				<p className="mt-0.5 text-[13px] text-product-muted">
					Most recent {rows.length} days
				</p>
			</div>
			<div className="-mx-1">
				<Table className="text-sm tabular-nums">
					<TableHeader className="bg-transparent">
						<TableRow>
							<TableHead className="h-auto px-2.5 py-2">Date</TableHead>
							<TableHead className="h-auto px-2.5 py-2 text-right">
								Page views
							</TableHead>
							<TableHead className="h-auto px-2.5 py-2 text-right">
								Unique visitors
							</TableHead>
							<TableHead className="hidden h-auto px-2.5 py-2 min-[521px]:table-cell">
								<span className="sr-only">Share of the busiest day</span>
							</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{rows.map((day) => {
							const isBest = busiest?.date === day.date;
							const share = max > 0 ? (day.views / max) * 100 : 0;
							return (
								<TableRow key={day.date}>
									<TableCell className="whitespace-nowrap px-1.5 py-2.5 min-[521px]:px-2.5">
										{formatDay(day.date)}
										{isBest && (
											<span className="ml-2 inline-block rounded-full bg-product-primary-soft px-[7px] py-0.5 align-[1px] text-[10.5px] font-bold leading-none text-product-primary-ink">
												Busiest
											</span>
										)}
									</TableCell>
									<TableCell className="px-1.5 py-2.5 text-right min-[521px]:px-2.5">
										{day.views.toLocaleString("en-US")}
									</TableCell>
									<TableCell className="px-1.5 py-2.5 text-right min-[521px]:px-2.5">
										{day.visitors.toLocaleString("en-US")}
									</TableCell>
									<TableCell className="hidden w-[34%] min-w-[90px] px-2.5 py-2.5 min-[521px]:table-cell">
										<span className="block h-1.5 overflow-hidden rounded bg-product-background-hero">
											<span
												className="block h-full rounded bg-product-primary"
												style={{ width: `${share}%` }}
											/>
										</span>
										<span className="sr-only">
											{Math.round(share)}% of the busiest day
										</span>
									</TableCell>
								</TableRow>
							);
						})}
					</TableBody>
				</Table>
			</div>
		</Card>
	);
}
