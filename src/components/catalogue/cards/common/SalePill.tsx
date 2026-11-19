import { cn } from "@/lib/ui/cn";

export interface SalePillProps {
	percentOff: number;
	size?: "normal" | "small";
	className?: string;
}

/**
 * The catalogue's one sale marker: cards show it on the item photo, the item
 * sheet beside the struck-through price. `--catalogue-sale` keeps it in the
 * owner's palette, and the corner radius follows their corner setting, so a
 * square-cornered catalogue gets a square tag.
 */
export function SalePill({
	percentOff,
	size = "normal",
	className,
}: SalePillProps) {
	return (
		<span
			className={cn(
				"inline-flex shrink-0 items-center rounded-[calc(var(--border-radius,12px)*999)] bg-catalogue-sale font-bold tabular-nums text-catalogue-sale-foreground",
				size === "small" ? "h-5 px-1.5 text-[11px]" : "h-6 px-2 text-[12px]",
				className,
			)}
		>
			<span className="sr-only">{percentOff}% off</span>
			<span aria-hidden="true">−{percentOff}%</span>
		</span>
	);
}
