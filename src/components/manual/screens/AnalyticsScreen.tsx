import { Screen, SpotMarker } from "@/components/manual/Screen";
import { cn } from "@/lib/ui/cn";

function MetricCard({
	label,
	value,
	delta,
	note,
	spot,
}: {
	label: string;
	value: string;
	delta?: string;
	note?: string;
	spot?: number;
}) {
	return (
		<div className="relative rounded-[16px] border border-product-border bg-product-card p-3.5">
			{spot ? <SpotMarker n={spot} /> : null}
			<p className="text-[12px] font-semibold text-product-muted">{label}</p>
			<p className="mt-1.5 font-product-heading text-[26px] font-extrabold leading-none tracking-[-0.03em] text-product-foreground">
				{value}
			</p>
			{note ? (
				<p className="mt-1.5 text-[11.5px] text-product-muted">{note}</p>
			) : null}
			{delta ? (
				<p className="mt-1.5 text-[11.5px] font-semibold text-product-success">
					{delta}
				</p>
			) : null}
		</div>
	);
}

const series = [38, 52, 44, 61, 70, 58, 86, 74, 66, 92, 80, 71, 64, 88];

/** A smooth area chart, the way the catalogue analytics page draws traffic. */
function TrafficChart() {
	const width = 860;
	const height = 120;
	const step = width / (series.length - 1);
	const points = series.map((value, index) => [
		index * step,
		height - (value / 100) * height,
	]);
	// Catmull-Rom style smoothing, which is what the chart library draws.
	const path = points
		.map(([x, y], index) => {
			if (index === 0) return `M ${x} ${y}`;
			const [px, py] = points[index - 1];
			const cx = px + step / 2;
			return `C ${cx} ${py} ${cx} ${y} ${x} ${y}`;
		})
		.join(" ");

	return (
		<svg
			aria-hidden="true"
			className="mt-3 w-full"
			height={height}
			viewBox={`0 0 ${width} ${height}`}
			width="100%"
		>
			<title>Daily page views</title>
			<defs>
				<linearGradient id="trafficFill" x1="0" x2="0" y1="0" y2="1">
					<stop
						offset="0%"
						stopColor="rgb(var(--product-chart-rgb))"
						stopOpacity="0.35"
					/>
					<stop
						offset="100%"
						stopColor="rgb(var(--product-chart-rgb))"
						stopOpacity="0.02"
					/>
				</linearGradient>
			</defs>
			<path
				d={`${path} L ${width} ${height} L 0 ${height} Z`}
				fill="url(#trafficFill)"
			/>
			<path
				d={path}
				fill="none"
				stroke="rgb(var(--product-chart-rgb))"
				strokeLinecap="round"
				strokeWidth="2.5"
			/>
		</svg>
	);
}

const days: [string, string, string, number][] = [
	["Mon, Sep 22", "88", "41", 75],
	["Sun, Sep 21", "71", "35", 60],
	["Sat, Sep 20", "118", "52", 100],
	["Fri, Sep 19", "64", "30", 54],
];

/** The analytics page for one catalogue over the last 30 days. */
export function AnalyticsScreen() {
	return (
		<Screen
			caption="The analytics page for one catalogue, over the last 30 days."
			height={800}
			legend={[
				"Switch between your catalogues",
				"Choose 7, 30 or 90 days",
				"Views and visitors, each against the period before",
				"Your busiest day in the period",
				"Page views day by day",
				"The last ten days as numbers",
			]}
			title="quicktalog.app/admin/brightside-cafe-menu/analytics"
			width={1000}
		>
			<div className="absolute inset-0 overflow-hidden bg-product-background p-7">
				<p className="text-[11px] font-bold uppercase tracking-[0.06em] text-product-primary-ink">
					Catalogue analytics
				</p>
				<p className="mt-1 font-product-heading text-[24px] font-extrabold tracking-[-0.03em] text-product-foreground">
					Analytics for Brightside Cafe
				</p>
				<p className="mt-1 text-[13px] text-product-foreground-accent">
					Track your catalogue performance and visitor insights.
				</p>

				<div className="mt-5 flex flex-wrap items-end gap-5">
					<div>
						<p className="mb-1 text-[11px] font-bold text-product-muted">
							Catalogue
						</p>
						<span className="relative flex h-9 w-[230px] items-center justify-between rounded-[12px] border border-product-border-strong bg-product-card px-3 text-[12.5px] text-product-foreground">
							<SpotMarker n={1} />
							Brightside Cafe Menu
							<span className="text-product-muted">&#9662;</span>
						</span>
					</div>
					<div>
						<p className="mb-1 text-[11px] font-bold text-product-muted">
							Date range
						</p>
						<span className="relative flex gap-1 rounded-[12px] bg-product-background-hero p-1">
							<SpotMarker n={2} />
							{["7 days", "30 days", "90 days"].map((range) => (
								<span
									className={cn(
										"rounded-[9px] px-3 py-1.5 text-[12px] font-semibold",
										range === "30 days"
											? "bg-product-card text-product-foreground shadow-product"
											: "text-product-muted",
									)}
									key={range}
								>
									{range}
								</span>
							))}
						</span>
					</div>
				</div>

				<div className="mt-4 grid grid-cols-4 gap-3">
					<MetricCard
						delta="+12.3% vs previous 30 days"
						label="Total views"
						spot={3}
						value="1,284"
					/>
					<MetricCard
						delta="+8.1% vs previous 30 days"
						label="Unique visitors"
						value="612"
					/>
					<MetricCard
						label="Most popular day"
						note="118 views"
						spot={4}
						value="Sat, Sep 20"
					/>
					<MetricCard label="Avg. views / day" value="42.80" />
				</div>

				<div className="relative mt-3.5 rounded-[16px] border border-product-border bg-product-card p-3.5">
					<SpotMarker n={5} />
					<div className="flex items-baseline gap-2">
						<p className="font-product-heading text-[14px] font-extrabold text-product-foreground">
							Traffic overview
						</p>
						<p className="text-[11.5px] text-product-muted">
							Daily page views over time
						</p>
						<span className="ml-auto flex items-center gap-1.5 text-[11.5px] text-product-foreground-accent">
							<span className="h-2 w-2 rounded-full bg-product-chart" />
							Page views
						</span>
					</div>
					<TrafficChart />
				</div>

				<div className="relative mt-3.5 rounded-[16px] border border-product-border bg-product-card p-3.5">
					<SpotMarker n={6} />
					<div className="flex items-baseline gap-2">
						<p className="font-product-heading text-[14px] font-extrabold text-product-foreground">
							By day
						</p>
						<p className="text-[11.5px] text-product-muted">
							Most recent 10 days
						</p>
					</div>
					<div className="mt-2 grid grid-cols-[150px_90px_110px_minmax(0,1fr)] items-center gap-y-1.5 text-[11.5px]">
						<span className="font-bold text-product-muted">Date</span>
						<span className="font-bold text-product-muted">Page views</span>
						<span className="font-bold text-product-muted">
							Unique visitors
						</span>
						<span />
						{days.map(([day, views, visitors, share]) => (
							<span className="contents" key={day}>
								<span className="flex items-center gap-1.5 text-product-foreground">
									{day}
									{share === 100 ? (
										<span className="rounded-full bg-product-primary-soft px-1.5 py-[1px] text-[10px] font-bold text-product-primary-ink">
											Busiest
										</span>
									) : null}
								</span>
								<span className="text-product-foreground-accent">{views}</span>
								<span className="text-product-foreground-accent">
									{visitors}
								</span>
								<span className="h-1.5 rounded-full bg-product-background-hero">
									<span
										className="block h-full rounded-full bg-product-chart/70"
										style={{ width: `${share}%` }}
									/>
								</span>
							</span>
						))}
					</div>
				</div>
			</div>
		</Screen>
	);
}
