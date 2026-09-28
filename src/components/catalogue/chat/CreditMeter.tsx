"use client";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/ui/cn";
import { CREDITS } from "@/lib/ai/pricing";
import type { GaugeStatus } from "@/types/shared";

const STATUS_RING_CLASS: Record<GaugeStatus, string> = {
	normal: "text-product-secondary",
	warning: "text-product-warning",
	critical: "text-error",
};

const STATUS_NOTE: Record<GaugeStatus, string> = {
	normal: "",
	warning: "Running low - the assistant still works.",
	critical: "You are out until the month resets.",
};

function statusFor(percent: number): GaugeStatus {
	if (percent >= 100) return "critical";
	if (percent >= 75) return "warning";
	return "normal";
}

/** A full ring: readable at 20px, so the same component serves the header and the popover. */
function Ring({
	percent,
	status,
	size,
	strokeWidth,
	children,
}: {
	percent: number;
	status: GaugeStatus;
	size: number;
	strokeWidth: number;
	children?: React.ReactNode;
}) {
	const radius = (size - strokeWidth) / 2;
	const circumference = 2 * Math.PI * radius;
	const filled = Math.min(Math.max(percent, 0), 100) / 100;

	return (
		<span
			className="relative flex shrink-0 items-center justify-center"
			style={{ width: size, height: size }}
		>
			<svg aria-hidden="true" className="block" height={size} width={size}>
				<title>AI credit usage</title>
				<circle
					className="text-product-border"
					cx={size / 2}
					cy={size / 2}
					fill="none"
					r={radius}
					stroke="currentColor"
					strokeWidth={strokeWidth}
				/>
				<circle
					className={cn(
						"transition-all duration-500",
						STATUS_RING_CLASS[status],
					)}
					cx={size / 2}
					cy={size / 2}
					fill="none"
					r={radius}
					stroke="currentColor"
					strokeDasharray={circumference}
					strokeDashoffset={circumference * (1 - filled)}
					strokeLinecap="round"
					strokeWidth={strokeWidth}
					transform={`rotate(-90 ${size / 2} ${size / 2})`}
				/>
			</svg>
			{children ? (
				<span className="absolute inset-0 flex flex-col items-center justify-center">
					{children}
				</span>
			) : null}
		</span>
	);
}

/**
 * Credits left, in the chat header. An ask no longer costs a fixed amount, so the
 * balance has to be visible while typing rather than discovered through a modal.
 */
const CreditMeter = ({ used, limit }: { used: number; limit: number }) => {
	if (!Number.isFinite(limit) || limit <= 0) return null;

	const percent = Math.round((used / limit) * 100);
	const status = statusFor(percent);
	const left = Math.max(0, limit - used);
	const over = Math.max(0, used - limit);

	return (
		<Popover>
			<PopoverTrigger asChild>
				<button
					aria-label={`AI credits: ${used} of ${limit} used. Show details.`}
					className="flex h-8 w-8 items-center justify-center rounded-full transition-colors hover:bg-black/5"
					title={`${left} AI credit${left === 1 ? "" : "s"} left`}
					type="button"
				>
					<Ring percent={percent} size={18} status={status} strokeWidth={3} />
				</button>
			</PopoverTrigger>

			<PopoverContent
				align="end"
				// Above the chat panel, which sits at z-[1050].
				className="z-[1100] w-64 font-lora"
				sideOffset={8}
			>
				<div className="flex flex-col items-center gap-3 text-center">
					<Ring percent={percent} size={96} status={status} strokeWidth={9}>
						<span className="text-lg font-bold tabular-nums text-product-foreground">
							{left}
						</span>
						<span className="text-[10px] leading-none text-product-foreground-accent">
							left
						</span>
					</Ring>

					<div className="space-y-0.5">
						<p className="font-lora-semibold text-sm font-bold text-product-foreground">
							AI credits
						</p>
						<p className="text-xs tabular-nums text-product-foreground-accent">
							{used} of {limit} used
							{over > 0 ? ` · ${over} over` : ""}
						</p>
					</div>

					{status !== "normal" && (
						<p
							className={cn(
								"rounded-full px-2.5 py-1 text-[11px] font-semibold",
								status === "critical"
									? "bg-error/10 text-error"
									: "bg-product-warning/10 text-product-warning",
							)}
						>
							{STATUS_NOTE[status]}
						</p>
					)}

					<p className="text-[11px] leading-relaxed text-product-foreground-accent">
						A question is free. An item description costs {CREDITS.describe},
						and a change costs {CREDITS.agentBase} plus one per extra task.
						Resets at the start of each month.
					</p>
				</div>
			</PopoverContent>
		</Popover>
	);
};

export default CreditMeter;
