import { Check } from "lucide-react";
import type { ReactNode } from "react";

/** Checklist with small amber check discs (`.as-ticks`). */
export function TickList({ items }: { items: ReactNode[] }) {
	return (
		<ul className="grid gap-2">
			{items.map((item, index) => (
				<li
					className="relative pl-[26px] text-sm text-product-foreground-accent [&_b]:text-product-foreground [&_strong]:text-product-foreground"
					key={index}
				>
					<span
						aria-hidden="true"
						className="absolute left-0 top-0.5 grid h-[18px] w-[18px] place-items-center rounded-full bg-product-primary-soft text-product-primary-ink ring-1 ring-product-primary/35"
					>
						<Check className="size-[11px]" strokeWidth={3} />
					</span>
					{item}
				</li>
			))}
		</ul>
	);
}
