import { Check } from "lucide-react";

/** Short "key takeaways" summary box, usually placed near the top of an article. */
export default function KeyTakeaways({ points }: { points: string[] }) {
	return (
		<aside className="my-8 rounded-2xl border border-product-border bg-product-background-hero p-6 sm:p-7">
			<p className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-product-secondary">
				Key takeaways
			</p>
			<ul className="space-y-2.5">
				{points.map((point) => (
					<li className="flex gap-3 text-product-foreground" key={point}>
						<Check className="mt-1 h-4 w-4 flex-shrink-0 text-product-primary" />
						<span>{point}</span>
					</li>
				))}
			</ul>
		</aside>
	);
}
