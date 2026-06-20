export interface Stat {
	/** Big headline figure, e.g. "30 sec" or "0". */
	value: string;
	/** Short label under the figure. */
	label: string;
}

/**
 * A row of large, scannable stat figures. Numbers use the display serif and
 * the high-contrast navy so they stay readable; hairline dividers between cells
 * come from the parent border showing through a 1px gap.
 */
export default function StatHighlights({ stats }: { stats: Stat[] }) {
	return (
		<div className="my-10 grid grid-cols-1 gap-px overflow-hidden rounded-2xl border border-product-border bg-product-border sm:grid-cols-3">
			{stats.map((stat) => (
				<div className="bg-product-background p-6 text-center" key={stat.label}>
					<div className="font-lora text-4xl font-bold text-product-secondary sm:text-5xl">
						{stat.value}
					</div>
					<div className="mx-auto mt-3 h-0.5 w-8 rounded-full bg-product-primary" />
					<div className="mt-3 text-sm text-product-foreground-accent">
						{stat.label}
					</div>
				</div>
			))}
		</div>
	);
}
