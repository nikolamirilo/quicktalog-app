import { cn } from "@/lib/ui/cn";
import type { GaugeStatus } from "@/types/shared";

export type GaugeChartProps = {
	used: number;
	limit: number;
	unit: string;
	/** Accessible name of the meter, e.g. "Traffic". */
	label: string;
};

/** Semicircle drawn left to right; `pathLength=100` makes the dash a percent. */
const ARC_PATH = "M10 60a50 50 0 0 1 100 0";

/**
 * Judged on the raw numbers, not the rounded percent: 995 of 1000 is close,
 * not "limit reached". A limit of 0 is reached by any use at all.
 */
export function getGaugeStatus(used: number, limit: number): GaugeStatus {
	if (limit <= 0) return used > 0 ? "critical" : "normal";
	if (used >= limit) return "critical";
	if (used / limit >= 0.8) return "warning";
	return "normal";
}

/** Percent shown to the user, rounded down so it reads 100% only at the limit. */
export function gaugePercent(used: number, limit: number) {
	if (limit <= 0) return used > 0 ? 100 : 0;
	return Math.floor((used / limit) * 100);
}

const ARC_TONE: Record<GaugeStatus, string> = {
	normal: "stroke-product-foreground",
	warning: "stroke-product-primary",
	critical: "stroke-product-error",
};

/** Usage arc meter (`.as-arc`): percent in the middle, "used / limit" below. */
export function GaugeChart({ used, limit, unit, label }: GaugeChartProps) {
	const percent = gaugePercent(used, limit);
	const status = getGaugeStatus(used, limit);
	const over = used > limit;
	// The arc stops at 100%; the number does not, so an overage stays visible.
	const arcPercent = Math.min(Math.max(percent, 0), 100);
	const usedText = used.toLocaleString("en-US");
	const limitText = limit.toLocaleString("en-US");

	return (
		<>
			<div
				aria-label={label}
				aria-valuemax={limit}
				aria-valuemin={0}
				aria-valuenow={Math.min(used, limit)}
				aria-valuetext={`${usedText} of ${limitText} ${unit}, ${percent}%`}
				className="relative mx-auto mt-3 w-[180px] max-w-full"
				role="meter"
			>
				<svg
					aria-hidden="true"
					className="block h-auto w-full overflow-visible"
					viewBox="0 0 120 66"
				>
					<path
						className="fill-none stroke-product-background-hero"
						d={ARC_PATH}
						pathLength={100}
						strokeLinecap="round"
						strokeWidth={11}
					/>
					{arcPercent > 0 && (
						<path
							className={cn("fill-none", ARC_TONE[status])}
							d={ARC_PATH}
							pathLength={100}
							strokeDasharray={`${arcPercent} 100`}
							strokeLinecap="round"
							strokeWidth={11}
						/>
					)}
				</svg>
				<p className="absolute inset-x-0 bottom-0 flex flex-col items-center leading-none">
					<b className="font-product-heading text-[30px] font-extrabold tracking-[-0.03em] tabular-nums">
						{percent}%
					</b>
					<small className="mt-1 text-xs text-product-muted">
						{over ? "over limit" : "of limit"}
					</small>
				</p>
			</div>
			<p className="mt-2 text-sm text-product-foreground-accent tabular-nums">
				<b className="text-base text-product-foreground">{usedText}</b> /{" "}
				{limitText} {unit}
			</p>
		</>
	);
}
