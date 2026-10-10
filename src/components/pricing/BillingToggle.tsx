"use client";

import type { BillingCycle } from "@/constants/pricing";
import { cn } from "@/lib/ui/cn";

const cycles: { value: BillingCycle; label: string }[] = [
	{ value: "monthly", label: "Monthly" },
	{ value: "yearly", label: "Yearly" },
];

/** Monthly / Yearly pill with a sliding amber thumb. */
export function BillingToggle({
	cycle,
	onChange,
	className,
}: {
	cycle: BillingCycle;
	onChange: (cycle: BillingCycle) => void;
	className?: string;
}) {
	return (
		<div className={cn("flex justify-center", className)}>
			<div
				aria-label="Billing cycle"
				className="relative inline-flex w-[260px] rounded-full border border-product-border bg-product-card p-1 shadow-[0_1px_2px_rgb(var(--product-foreground-rgb)/0.05)]"
				role="group"
			>
				<span
					aria-hidden="true"
					className={cn(
						"absolute bottom-1 left-1 top-1 w-[calc(50%-4px)] rounded-full bg-product-primary shadow-product-primary transition-transform duration-300",
						cycle === "yearly" && "translate-x-full",
					)}
				/>
				{cycles.map(({ value, label }) => (
					<button
						aria-pressed={cycle === value}
						className="relative z-[1] flex-1 rounded-full px-4 py-[9px] text-[14.5px] font-medium text-product-foreground/60 aria-pressed:font-bold aria-pressed:text-product-foreground"
						key={value}
						onClick={() => onChange(value)}
						type="button"
					>
						{label}
					</button>
				))}
			</div>
		</div>
	);
}
