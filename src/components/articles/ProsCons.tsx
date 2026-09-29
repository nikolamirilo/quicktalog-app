import { Check, X } from "lucide-react";

interface Props {
	/** Optional heading above the two columns, e.g. the tool being weighed. */
	title?: string;
	pros: string[];
	cons: string[];
	prosLabel?: string;
	consLabel?: string;
}

/** Side-by-side pros and cons. Colour is backed by icons and labels, never the only signal. */
export function ProsCons({
	title,
	pros,
	cons,
	prosLabel = "The good",
	consLabel = "The catch",
}: Props) {
	return (
		<div>
			{title && (
				<p className="mb-3 font-product-heading text-[17px] font-bold leading-[1.35] text-product-foreground">
					{title}
				</p>
			)}
			<div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
				<div className="flex flex-col gap-3 rounded-[18px] border-[1.5px] border-product-primary/55 bg-product-card px-[18px] pb-4 pt-[18px] shadow-product ring-[5px] ring-product-primary/[0.07]">
					<p className="text-[12.5px] font-bold uppercase tracking-[0.08em] text-product-primary-ink">
						{prosLabel}
					</p>
					<ul className="grid gap-[9px]">
						{pros.map((p) => (
							<li
								className="flex items-start gap-2.5 text-[15px] font-medium leading-[1.45] text-product-foreground"
								key={p}
							>
								<span
									aria-hidden="true"
									className="mt-px grid h-5 w-5 flex-none place-items-center rounded-full bg-product-primary-soft text-product-primary-ink"
								>
									<Check className="h-3 w-3" strokeWidth={3} />
								</span>
								<span>{p}</span>
							</li>
						))}
					</ul>
				</div>
				<div className="flex flex-col gap-3 rounded-[18px] border border-dashed border-product-border-strong bg-product-background-hero px-[18px] pb-4 pt-[18px]">
					<p className="text-[12.5px] font-bold uppercase tracking-[0.08em] text-product-muted">
						{consLabel}
					</p>
					<ul className="grid gap-[9px]">
						{cons.map((c) => (
							<li
								className="flex items-start gap-2.5 text-[15px] leading-[1.45] text-product-muted"
								key={c}
							>
								<span
									aria-hidden="true"
									className="mt-px grid h-5 w-5 flex-none place-items-center rounded-full bg-product-error-soft text-product-error"
								>
									<X className="h-3 w-3" strokeWidth={3} />
								</span>
								<span>{c}</span>
							</li>
						))}
					</ul>
				</div>
			</div>
		</div>
	);
}
