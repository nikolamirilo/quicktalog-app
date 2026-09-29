import {
	CalendarDays,
	Eye,
	type LucideIcon,
	TrendingUp,
	Users,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import {
	describeDelta,
	formatDay,
	type TrafficDelta,
	type TrafficRange,
	type TrafficSummary,
} from "@/lib/analytics/traffic";
import { cn } from "@/lib/ui/cn";

const number = (n: number) => n.toLocaleString("en-US");

function Delta({ delta }: { delta: TrafficDelta }) {
	return (
		<small className="text-[12.5px] leading-snug text-product-muted">
			{delta.value && (
				<b
					className={cn(
						"font-bold",
						delta.direction === "up" && "text-product-success",
						delta.direction === "down" && "text-product-error",
						delta.direction === "flat" && "text-product-foreground-accent",
					)}
				>
					{delta.value}
				</b>
			)}{" "}
			{delta.text}
		</small>
	);
}

function Kpi({
	icon: Icon,
	label,
	value,
	note,
	delta,
}: {
	icon: LucideIcon;
	label: string;
	value: string;
	note?: string;
	delta: TrafficDelta;
}) {
	return (
		<Card className="relative flex min-w-0 flex-col gap-1 p-4">
			<span
				aria-hidden="true"
				className="absolute right-3.5 top-3.5 grid h-[34px] w-[34px] place-items-center rounded-[11px] border border-product-primary/35 bg-product-primary-soft text-product-primary-ink"
			>
				<Icon className="h-4 w-4" />
			</span>
			<span className="pr-10 text-[13px] font-semibold leading-snug text-product-foreground-accent">
				{label}
			</span>
			<b className="mt-1.5 truncate font-product-heading text-[clamp(22px,3vw,30px)] font-extrabold leading-tight tracking-[-0.03em] tabular-nums">
				{value}
			</b>
			{note && (
				<small className="text-[12.5px] leading-snug text-product-muted">
					{note}
				</small>
			)}
			<Delta delta={delta} />
		</Card>
	);
}

export function KpiCards({
	summary,
	range,
}: {
	summary: TrafficSummary;
	range: TrafficRange;
}) {
	const best = summary.best.current;
	return (
		<div className="mb-3.5 grid grid-cols-2 gap-2.5 min-[1100px]:grid-cols-4 min-[1100px]:gap-3.5">
			<Kpi
				delta={describeDelta(
					summary.views.current,
					summary.views.previous,
					range,
				)}
				icon={Eye}
				label="Total views"
				value={number(summary.views.current)}
			/>
			<Kpi
				delta={describeDelta(
					summary.visitors.current,
					summary.visitors.previous,
					range,
					"visitors",
				)}
				icon={Users}
				label="Unique visitors"
				value={number(summary.visitors.current)}
			/>
			<Kpi
				delta={describeDelta(
					best?.views ?? 0,
					summary.best.previous?.views ?? 0,
					range,
				)}
				icon={CalendarDays}
				label="Most popular day"
				note={best ? `${number(best.views)} views` : undefined}
				value={best ? formatDay(best.date) : "–"}
			/>
			<Kpi
				delta={describeDelta(
					summary.average.current,
					summary.average.previous,
					range,
				)}
				icon={TrendingUp}
				label="Avg. views / day"
				value={summary.average.current.toFixed(2)}
			/>
		</div>
	);
}
