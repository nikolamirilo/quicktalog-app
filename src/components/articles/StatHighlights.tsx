export interface Stat {
	/** Big headline figure, e.g. "30 sec" or "0". */
	value: string;
	/** Short label under the figure. */
	label: string;
}

/** A row of large, scannable stat figures (three columns from small screens up). */
export function StatHighlights({ stats }: { stats: Stat[] }) {
	return (
		<div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
			{stats.map((stat) => (
				<div
					className="rounded-[18px] border border-product-border bg-product-card px-5 py-[18px] shadow-[0_1px_2px_rgba(22,20,15,0.04)]"
					key={stat.label}
				>
					<b className="block font-product-heading text-[clamp(26px,3vw,32px)] font-extrabold leading-[1.1] tracking-[-0.03em] text-product-foreground">
						{stat.value}
					</b>
					<span className="mt-1.5 block text-[14.5px] leading-[1.45] text-product-muted">
						{stat.label}
					</span>
				</div>
			))}
		</div>
	);
}
