import {
	CalendarDays,
	ChevronDown,
	Eye,
	type LucideIcon,
	TrendingUp,
	Users,
} from "lucide-react";

import { Screen, SpotMarker } from "@/components/manual/Screen";
import { AppNavbar, PageWash } from "@/components/manual/screens/kit";
import { cn } from "@/lib/ui/cn";

/**
 * The per-catalogue analytics page at 1280px: the page header with the
 * catalogue switcher and the range control, four KPI cards, the traffic chart
 * and the By day table. The page hides the footer, so it ends with the table.
 */

/** Page views for every day of the period, oldest first: Feb 13 to Mar 14, 2026. */
const views = [
	38, 59, 47, 22, 21, 25, 28, 40, 62, 53, 24, 23, 27, 30, 43, 66, 57, 26, 24,
	29, 34, 47, 118, 62, 31, 28, 33, 37, 54, 96,
];

/** The busiest day of the whole period. Bars and the badge are scaled to it. */
const busiest = 118;

/** The last ten days, newest first, the way the By day table lists them. */
const recent: [string, number, number][] = [
	["Sat, Mar 14", 96, 44],
	["Fri, Mar 13", 54, 26],
	["Thu, Mar 12", 37, 19],
	["Wed, Mar 11", 33, 17],
	["Tue, Mar 10", 28, 15],
	["Mon, Mar 9", 31, 16],
	["Sun, Mar 8", 62, 30],
	["Sat, Mar 7", 118, 54],
	["Fri, Mar 6", 47, 24],
	["Thu, Mar 5", 34, 18],
];

/** The date labels under the chart: month and day only, as the real axis has. */
const ticks: [number, string][] = [
	[0, "Feb 13"],
	[5, "Feb 18"],
	[10, "Feb 23"],
	[15, "Feb 28"],
	[20, "Mar 5"],
	[25, "Mar 10"],
	[29, "Mar 14"],
];

/** The plot area inside the 1180 x 330 chart box, in product pixels. */
const plot = { bottom: 300, left: 50, max: 120, right: 1168, top: 6 };

function pointAt(index: number, value: number): [number, number] {
	const step = (plot.right - plot.left) / (views.length - 1);
	return [
		plot.left + index * step,
		plot.bottom - (value / plot.max) * (plot.bottom - plot.top),
	];
}

const points = views.map((value, index) => pointAt(index, value));

/** A Catmull-Rom spline through the points: the smooth curve the chart draws. */
const curve = points
	.map(([x, y], index) => {
		if (index === 0) return `M ${x.toFixed(1)} ${y.toFixed(1)}`;
		const [x0, y0] = points[index - 1];
		const [xp, yp] = points[index - 2] ?? points[index - 1];
		const [xn, yn] = points[index + 1] ?? points[index];
		const c1x = x0 + (x - xp) / 6;
		const c1y = y0 + (y - yp) / 6;
		const c2x = x - (xn - x0) / 6;
		const c2y = y - (yn - y0) / 6;
		return `C ${c1x.toFixed(1)} ${c1y.toFixed(1)} ${c2x.toFixed(1)} ${c2y.toFixed(1)} ${x.toFixed(1)} ${y.toFixed(1)}`;
	})
	.join(" ");

const last = points[points.length - 1];

/** One of the four summary cards, 16px padding with the amber tile in the corner. */
function Kpi({
	delta,
	icon: Icon,
	label,
	note,
	spotDelta,
	spotTile,
	tone = "up",
	value,
}: {
	/** The coloured part of the comparison line, such as "+12.3%". */
	delta: string;
	icon: LucideIcon;
	label: string;
	note?: string;
	spotDelta?: number;
	spotTile?: number;
	tone?: "up" | "down";
	value: string;
}) {
	return (
		<div className="relative flex min-w-0 flex-col gap-1 rounded-product-card border border-product-border bg-product-card p-4 shadow-product">
			<span
				aria-hidden="true"
				className="absolute right-3.5 top-3.5 grid h-[34px] w-[34px] place-items-center rounded-[11px] border border-product-primary/35 bg-product-primary-soft text-product-primary-ink"
			>
				{spotTile ? (
					<SpotMarker className="-left-3 -top-3" n={spotTile} />
				) : null}
				<Icon className="h-4 w-4" />
			</span>
			<span className="pr-10 text-[13px] font-semibold leading-snug text-product-foreground-accent">
				{label}
			</span>
			<span className="mt-1.5 truncate font-product-heading text-[30px] font-extrabold leading-tight tracking-[-0.03em] tabular-nums text-product-foreground">
				{value}
			</span>
			{note ? (
				<span className="text-[12.5px] leading-snug text-product-muted">
					{note}
				</span>
			) : null}
			<span className="relative text-[12.5px] leading-snug text-product-muted">
				{spotDelta ? (
					<SpotMarker className="-left-5 -top-1" n={spotDelta} />
				) : null}
				<b
					className={cn(
						"font-bold",
						tone === "up" ? "text-product-success" : "text-product-error",
					)}
				>
					{delta}
				</b>{" "}
				vs previous 30 days
			</span>
		</div>
	);
}

/** The amber area chart: 330px tall, horizontal grid only, no dots in between. */
function TrafficChart() {
	return (
		<svg aria-hidden="true" className="h-[330px] w-full" viewBox="0 0 1180 330">
			<title>Daily page views</title>
			<defs>
				<linearGradient id="analyticsArea" x1="0" x2="0" y1="0" y2="1">
					<stop
						offset="0%"
						stopOpacity="0.32"
						style={{ stopColor: "var(--product-chart)" }}
					/>
					<stop
						offset="100%"
						stopOpacity="0"
						style={{ stopColor: "var(--product-primary)" }}
					/>
				</linearGradient>
			</defs>
			{[0, 30, 60, 90, 120].map((value) => {
				const y = pointAt(0, value)[1];
				return (
					<g key={value}>
						<line
							className="stroke-product-border"
							strokeWidth="1"
							x1={plot.left}
							x2={plot.right}
							y1={y}
							y2={y}
						/>
						<text
							className="fill-product-muted text-[11.5px] font-medium"
							dominantBaseline="middle"
							textAnchor="end"
							x="40"
							y={y}
						>
							{value}
						</text>
					</g>
				);
			})}
			<path
				d={`${curve} L ${plot.right} ${plot.bottom} L ${plot.left} ${plot.bottom} Z`}
				fill="url(#analyticsArea)"
			/>
			<path
				className="stroke-product-chart"
				d={curve}
				fill="none"
				strokeLinecap="round"
				strokeWidth="2"
			/>
			<circle
				className="fill-product-chart stroke-product-card"
				cx={last[0]}
				cy={last[1]}
				r="4"
				strokeWidth="2"
			/>
			{ticks.map(([index, label]) => (
				<text
					className="fill-product-muted text-[11.5px] font-medium"
					key={label}
					textAnchor={index === 29 ? "end" : "middle"}
					x={pointAt(index, 0)[0]}
					y="320"
				>
					{label}
				</text>
			))}
		</svg>
	);
}

/** The analytics page for one catalogue, over the last 30 days. */
export function AnalyticsScreen() {
	return (
		<Screen
			caption="The analytics page for one catalogue: the catalogue switcher and the date range, four summary cards, the daily page views chart and the By day table."
			height={1470}
			legend={[
				"Switch to another of your catalogues without leaving the page",
				"Choose the period: 7, 30 or 90 days, and 30 is the one you start on",
				"Four summary cards: total views, unique visitors, busiest day and daily average",
				"Every card compares itself with the period of the same length before it, green for up and red for down",
				"Daily page views over the period, with the dark pill on the most recent day",
				"The last ten days, newest first, with the bars scaled to the busiest day of the whole period",
			]}
			title="https://www.quicktalog.app/admin/brightside-cafe-menu/analytics?range=30"
			width={1280}
		>
			<PageWash>
				<AppNavbar />
				<div className="absolute inset-x-0 top-[120px] mx-auto max-w-[1280px] px-8 pt-1 text-product-foreground">
					<div className="mb-[18px] flex items-end justify-between gap-4">
						<div className="min-w-0">
							<span className="mb-1 inline-block text-sm font-bold text-product-primary-ink">
								Catalogue analytics
							</span>
							<p className="font-product-heading text-[34px] font-extrabold leading-[1.12] tracking-[-0.03em]">
								Analytics for Brightside Cafe Menu
							</p>
							<p className="mt-1.5 text-[15px] text-product-foreground-accent">
								Track your catalogue performance and visitor insights.
							</p>
						</div>
						<div className="flex flex-none items-center gap-2">
							<span className="relative flex h-10 w-[224px] items-center justify-between gap-2 rounded-xl border border-product-border-strong bg-product-card px-3 text-[15px] font-semibold text-product-foreground">
								<SpotMarker n={1} />
								Brightside Cafe Menu
								<ChevronDown className="h-4 w-4 flex-none text-product-muted" />
							</span>
							<span className="relative inline-flex gap-0.5 rounded-xl border border-product-border bg-product-background-hero p-[3px]">
								<SpotMarker n={2} />
								{["7 days", "30 days", "90 days"].map((range) => (
									<span
										className={cn(
											"inline-flex min-h-8 items-center justify-center whitespace-nowrap rounded-[9px] px-3 text-[13px] font-semibold text-product-foreground-accent",
											range === "30 days" &&
												"bg-product-card text-product-foreground shadow-[0_1px_2px_rgb(22_20_15/0.08),0_2px_6px_rgb(22_20_15/0.06)]",
										)}
										key={range}
									>
										{range}
									</span>
								))}
							</span>
						</div>
					</div>

					<div className="mb-3.5 grid grid-cols-4 gap-3.5">
						<Kpi
							delta="+12.3%"
							icon={Eye}
							label="Total views"
							spotDelta={4}
							spotTile={3}
							value="1,284"
						/>
						<Kpi
							delta="+8.1%"
							icon={Users}
							label="Unique visitors"
							value="612"
						/>
						<Kpi
							delta="−4.1%"
							icon={CalendarDays}
							label="Most popular day"
							note="118 views"
							tone="down"
							value="Sat, Mar 7"
						/>
						<Kpi
							delta="+12.3%"
							icon={TrendingUp}
							label="Avg. views / day"
							value="42.80"
						/>
					</div>

					<div className="mb-3.5 rounded-product-card border border-product-border bg-product-card p-[18px] shadow-product">
						<div className="mb-3.5 flex items-start justify-between gap-3">
							<div>
								<p className="font-product-heading text-[17px] font-extrabold leading-[1.12] tracking-[-0.015em]">
									Traffic overview
								</p>
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
						<div className="relative">
							<TrafficChart />
							<span className="absolute right-0 top-[38px] inline-flex items-center rounded-[3px] bg-product-foreground px-1.5 py-[3px] text-[11px] font-semibold leading-[1.1] text-product-card">
								<SpotMarker className="-right-3 -top-3 left-auto" n={5} />
								Today · 96
							</span>
						</div>
					</div>

					<div className="rounded-product-card border border-product-border bg-product-card p-[18px] shadow-product">
						<div className="mb-3.5">
							<p className="font-product-heading text-[17px] font-extrabold leading-[1.12] tracking-[-0.015em]">
								By day
							</p>
							<p className="mt-0.5 text-[13px] text-product-muted">
								Most recent 10 days
							</p>
						</div>
						<div className="-mx-1">
							<table className="w-full text-sm tabular-nums">
								<thead className="[&_tr]:border-b [&_tr]:border-product-border">
									<tr>
										<th
											className="px-2.5 py-2 text-left text-xs font-bold text-product-muted"
											scope="col"
										>
											Date
										</th>
										<th
											className="px-2.5 py-2 text-right text-xs font-bold text-product-muted"
											scope="col"
										>
											Page views
										</th>
										<th
											className="px-2.5 py-2 text-right text-xs font-bold text-product-muted"
											scope="col"
										>
											Unique visitors
										</th>
										<th
											className="w-[34%] min-w-[90px] px-2.5 py-2"
											scope="col"
										/>
									</tr>
								</thead>
								<tbody className="[&_tr:last-child]:border-0">
									{recent.map(([date, dayViews, visitors]) => (
										<tr className="border-b border-product-border" key={date}>
											<td className="whitespace-nowrap px-2.5 py-2.5">
												{date}
												{dayViews === busiest ? (
													<span className="ml-2 inline-block rounded-full bg-product-primary-soft px-[7px] py-0.5 align-[1px] text-[10.5px] font-bold leading-none text-product-primary-ink">
														Busiest
													</span>
												) : null}
											</td>
											<td className="px-2.5 py-2.5 text-right">{dayViews}</td>
											<td className="px-2.5 py-2.5 text-right">{visitors}</td>
											<td className="relative w-[34%] min-w-[90px] px-2.5 py-2.5">
												{dayViews === busiest ? <SpotMarker n={6} /> : null}
												<span className="block h-1.5 overflow-hidden rounded bg-product-background-hero">
													<span
														className="block h-full rounded bg-product-primary"
														style={{
															width: `${(dayViews / busiest) * 100}%`,
														}}
													/>
												</span>
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					</div>
				</div>
			</PageWash>
		</Screen>
	);
}
