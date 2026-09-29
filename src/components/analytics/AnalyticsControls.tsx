"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { useRadioKeys } from "@/hooks/useRadioKeys";
import { TRAFFIC_RANGES, type TrafficRange } from "@/lib/analytics/traffic";
import { kebabToTitle } from "@/lib/format/text";
import { cn } from "@/lib/ui/cn";

type Props = {
	catalogue: string;
	catalogues: string[];
	range: TrafficRange;
};

/** Catalogue switcher and the 7 / 30 / 90 day range, both driven by the URL. */
export function AnalyticsControls({ catalogue, catalogues, range }: Props) {
	const router = useRouter();
	const [isPending, startTransition] = useTransition();
	// Reflect a click at once; the server render catches up with the URL.
	const [selected, setSelected] = useState<TrafficRange>(range);

	// Back/forward navigation changes the URL without a click.
	useEffect(() => setSelected(range), [range]);

	const go = (name: string, days: TrafficRange) =>
		startTransition(() => {
			router.push(`/admin/${encodeURIComponent(name)}/analytics?range=${days}`);
		});

	const selectRange = (days: TrafficRange) => {
		if (days === selected) return;
		setSelected(days);
		go(catalogue, days);
	};

	const { onKeyDown, itemProps } = useRadioKeys(
		TRAFFIC_RANGES,
		selected,
		selectRange,
	);

	return (
		<div
			aria-busy={isPending}
			className={cn(
				"flex flex-wrap items-center gap-2 transition-opacity",
				isPending && "opacity-70",
			)}
		>
			<div className="min-w-0 flex-[1_1_180px]">
				<Select onValueChange={(name) => go(name, selected)} value={catalogue}>
					<SelectTrigger
						aria-label="Catalogue"
						className="h-10 rounded-xl border px-3 text-sm font-semibold"
					>
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						{catalogues.map((name) => (
							<SelectItem key={name} value={name}>
								{kebabToTitle(name)}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</div>
			<div
				aria-label="Date range"
				className="inline-flex gap-0.5 rounded-xl border border-product-border bg-product-background-hero p-[3px]"
				onKeyDown={onKeyDown}
				role="radiogroup"
			>
				{TRAFFIC_RANGES.map((days, i) => {
					const checked = days === selected;
					return (
						<button
							{...itemProps(days, i)}
							className={cn(
								"inline-flex min-h-8 items-center justify-center whitespace-nowrap rounded-[9px] px-3 text-[13px] font-semibold text-product-foreground-accent transition-colors hover:text-product-foreground",
								checked &&
									"bg-product-card text-product-foreground shadow-[0_1px_2px_rgb(var(--product-foreground-rgb)/0.08),0_2px_6px_rgb(var(--product-foreground-rgb)/0.06)]",
							)}
							key={days}
						>
							{days} days
						</button>
					);
				})}
			</div>
		</div>
	);
}
