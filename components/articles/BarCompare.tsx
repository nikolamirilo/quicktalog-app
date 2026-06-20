export interface BarItem {
	label: string;
	/** Numeric value driving the bar width. */
	value: number;
	/** Text shown at the end of the bar, e.g. "$0" or "2 min". Defaults to value. */
	display?: string;
	/** Emphasize this bar in brand amber (usually the Quicktalog row). */
	highlight?: boolean;
}

interface Props {
	title?: string;
	items: BarItem[];
	/** Upper bound for the bars. Defaults to the largest value. */
	max?: number;
	caption?: string;
}

/**
 * Horizontal bar chart for quick visual comparisons (cost, time, effort).
 * Each bar carries its own text value, so the chart is readable without relying
 * on color alone. The highlighted bar uses brand amber, the rest use navy.
 */
export default function BarCompare({ title, items, max, caption }: Props) {
	const ceiling = max ?? Math.max(...items.map((i) => i.value), 1);

	return (
		<figure className="my-10 rounded-2xl border border-product-border bg-product-background-hero p-6 sm:p-7">
			{title && (
				<figcaption className="mb-5 font-lora-semibold text-base font-semibold text-product-foreground">
					{title}
				</figcaption>
			)}
			<div className="space-y-4">
				{items.map((item) => (
					<div key={item.label}>
						<div className="mb-1.5 flex items-baseline justify-between gap-3 text-sm">
							<span className="font-medium text-product-foreground">
								{item.label}
							</span>
							<span className="font-lora-semibold font-semibold text-product-foreground">
								{item.display ?? item.value}
							</span>
						</div>
						<div className="h-3 w-full overflow-hidden rounded-full bg-product-background">
							<div
								className={`h-full rounded-full ${
									item.highlight ? "bg-product-primary" : "bg-product-secondary"
								}`}
								style={{
									width: `${Math.max((item.value / ceiling) * 100, 4)}%`,
								}}
							/>
						</div>
					</div>
				))}
			</div>
			{caption && (
				<p className="mt-5 text-xs text-product-foreground-accent">{caption}</p>
			)}
		</figure>
	);
}
