import { Check, X } from "lucide-react";

interface Props {
	/** Optional heading above the two columns, e.g. the tool being weighed. */
	title?: string;
	pros: string[];
	cons: string[];
	prosLabel?: string;
	consLabel?: string;
}

/** Side-by-side pros and cons. Color is backed by icons, never the only signal. */
export default function ProsCons({
	title,
	pros,
	cons,
	prosLabel = "The good",
	consLabel = "The catch",
}: Props) {
	return (
		<div className="my-10">
			{title && (
				<h4 className="mb-4 font-lora text-xl font-bold text-product-foreground">
					{title}
				</h4>
			)}
			<div className="grid gap-4 sm:grid-cols-2">
				<div className="rounded-2xl border border-product-border bg-product-background p-6">
					<p className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-product-foreground">
						<span className="flex h-6 w-6 items-center justify-center rounded-full bg-green-100">
							<Check className="h-4 w-4 text-green-600" />
						</span>
						{prosLabel}
					</p>
					<ul className="space-y-3">
						{pros.map((p) => (
							<li
								className="flex gap-2.5 text-product-foreground-accent"
								key={p}
							>
								<Check className="mt-1 h-4 w-4 flex-shrink-0 text-green-600" />
								<span>{p}</span>
							</li>
						))}
					</ul>
				</div>
				<div className="rounded-2xl border border-product-border bg-product-background p-6">
					<p className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-product-foreground">
						<span className="flex h-6 w-6 items-center justify-center rounded-full bg-red-100">
							<X className="h-4 w-4 text-red-500" />
						</span>
						{consLabel}
					</p>
					<ul className="space-y-3">
						{cons.map((c) => (
							<li
								className="flex gap-2.5 text-product-foreground-accent"
								key={c}
							>
								<X className="mt-1 h-4 w-4 flex-shrink-0 text-red-500" />
								<span>{c}</span>
							</li>
						))}
					</ul>
				</div>
			</div>
		</div>
	);
}
