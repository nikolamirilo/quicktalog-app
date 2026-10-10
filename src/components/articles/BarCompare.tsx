interface BarItem {
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
 * Each bar carries its own text value, so the chart reads without colour; the
 * highlighted row is amber and also marked with a dot.
 */
export function BarCompare({ title, items, max, caption }: Props) {
	const ceiling = max ?? Math.max(...items.map((i) => i.value), 1);

	return (
		<figure className="rounded-product-card border border-product-border bg-product-card p-[22px] shadow-product">
			{title && (
				<p className="font-product-heading text-[17px] font-bold leading-[1.35] tracking-[-0.01em] text-product-foreground">
					{title}
				</p>
			)}
			<ul className="mt-4 grid gap-3.5">
				{items.map((item) => (
					<li
						className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1.5"
						key={item.label}
					>
						<span className="text-[14.5px] font-semibold leading-[1.35] text-product-foreground">
							{item.label}
							{item.highlight && (
								<span
									aria-hidden="true"
									className="ml-2 inline-block h-[7px] w-[7px] rounded-full bg-product-primary align-[0.12em]"
								/>
							)}
						</span>
						<span className="font-product-heading text-[15px] font-extrabold leading-none tabular-nums text-product-foreground">
							{item.display ?? item.value}
						</span>
						<span
							aria-hidden="true"
							className="col-span-2 h-3 overflow-hidden rounded-full bg-product-background-hero"
						>
							<span
								className={`block h-full rounded-full ${
									item.highlight
										? "bg-product-primary"
										: "bg-product-border-strong"
								}`}
								style={{
									width: `${Math.max((item.value / ceiling) * 100, 3)}%`,
								}}
							/>
						</span>
					</li>
				))}
			</ul>
			{caption && (
				<figcaption className="mt-3.5 text-[13.5px] leading-[1.55] text-product-muted">
					{caption}
				</figcaption>
			)}
		</figure>
	);
}
