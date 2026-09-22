import { cn } from "@/helpers/client";
import type { GaugeChartProps, GaugeStatus } from "@/types/shared";

const RADIUS = 95;
const HALF_CIRCUMFERENCE = Math.PI * RADIUS;
const ARC_PATH = "M25,140 A95,95 0 0 1 215,140";

const STATUS_ARC_CLASS: Record<GaugeStatus, string> = {
	normal: "text-product-secondary",
	warning: "text-product-warning",
	critical: "text-error",
};

const STATUS_CHIP_CLASS: Record<GaugeStatus, string> = {
	normal: "",
	warning: "bg-product-warning/10 text-product-warning",
	critical: "bg-error/10 text-error",
};

const STATUS_LABEL: Record<GaugeStatus, string> = {
	normal: "",
	warning: "Near limit",
	critical: "Limit reached",
};

function getStatus(percent: number): GaugeStatus {
	if (percent >= 100) return "critical";
	if (percent >= 75) return "warning";
	return "normal";
}

export default function GaugeChart({ used, limit, unit }: GaugeChartProps) {
	const percent = limit > 0 ? Math.round((used / limit) * 100) : 0;
	const status = getStatus(percent);
	const arcPercent = Math.min(Math.max(percent, 0), 100);
	const offset = HALF_CIRCUMFERENCE * (1 - arcPercent / 100);
	const overBy = percent > 100 ? percent - 100 : 0;

	return (
		<div className="flex flex-col items-center gap-4">
			<div className="relative">
				<svg
					aria-label={`${percent}% of ${unit} limit used: ${used.toLocaleString("en-US")} of ${limit.toLocaleString("en-US")}`}
					height="170"
					role="img"
					viewBox="0 0 240 170"
					width="240"
				>
					<path
						className="text-product-border"
						d={ARC_PATH}
						fill="none"
						stroke="currentColor"
						strokeLinecap="round"
						strokeWidth="20"
					/>
					<path
						className={STATUS_ARC_CLASS[status]}
						d={ARC_PATH}
						fill="none"
						stroke="currentColor"
						strokeDasharray={HALF_CIRCUMFERENCE}
						strokeDashoffset={offset}
						strokeLinecap="round"
						strokeWidth="20"
					/>
				</svg>
				<div className="absolute inset-x-0 top-[58%] flex -translate-y-1/2 flex-col items-center">
					<span className="text-4xl font-bold text-product-foreground tabular-nums">
						{overBy > 0 ? "100%" : `${percent}%`}
					</span>
					<span className="text-sm text-product-foreground-accent">
						{overBy > 0 ? "capped" : "of limit"}
					</span>
				</div>
			</div>
			<div className="flex flex-col items-center gap-2">
				<span className="text-base text-product-foreground-accent tabular-nums">
					{used.toLocaleString("en-US")} / {limit.toLocaleString("en-US")}{" "}
					{unit}
				</span>
				{status !== "normal" ? (
					<span
						className={cn(
							"inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold",
							STATUS_CHIP_CLASS[status],
						)}
					>
						<span className="h-1.5 w-1.5 rounded-full bg-current" />
						{overBy > 0 ? `${overBy}% over limit` : STATUS_LABEL[status]}
					</span>
				) : null}
			</div>
		</div>
	);
}
