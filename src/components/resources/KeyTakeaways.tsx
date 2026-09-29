import { Check, Flag } from "lucide-react";

/** Short "key takeaways" summary box, usually placed near the top of an article. */
export function KeyTakeaways({ points }: { points: string[] }) {
	return (
		<aside
			aria-label="Key takeaways"
			className="rounded-product-card border border-product-primary/45 bg-product-amber-panel px-[22px] pb-5 pt-[22px]"
		>
			<p className="mb-3 flex items-center gap-2 text-[15px] font-bold leading-none tracking-[0.14em] text-product-primary-ink [font-variant-caps:all-small-caps]">
				<Flag aria-hidden="true" className="h-4 w-4" />
				Key takeaways
			</p>
			<ul className="grid gap-2.5">
				{points.map((point) => (
					<li
						className="flex items-start gap-2.5 text-[15.5px] leading-[1.55] text-product-foreground"
						key={point}
					>
						<span
							aria-hidden="true"
							className="mt-[3px] grid h-5 w-5 flex-none place-items-center rounded-full bg-product-primary text-product-foreground"
						>
							<Check className="h-3 w-3" strokeWidth={3} />
						</span>
						<span>{point}</span>
					</li>
				))}
			</ul>
		</aside>
	);
}
