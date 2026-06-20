import { ArrowLeft, ArrowRight } from "lucide-react";
import Link from "next/link";
import type { DocEntry } from "@/content/docs/_types";

/** Previous and next topic links at the foot of a docs page. */
export default function DocPager({
	prev,
	next,
}: {
	prev?: DocEntry;
	next?: DocEntry;
}) {
	if (!prev && !next) return null;

	return (
		<nav
			aria-label="Docs navigation"
			className="mt-16 border-t border-product-border pt-8"
		>
			<div className="grid gap-4 sm:grid-cols-2">
				{prev ? (
					<Link
						className="group flex flex-col rounded-xl border border-product-border bg-product-background p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-product-primary hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-product-primary focus-visible:ring-offset-2"
						href={`/docs/${prev.meta.slug}`}
					>
						<span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-product-foreground-accent">
							<ArrowLeft
								aria-hidden
								className="h-4 w-4 transition-transform duration-200 group-hover:-translate-x-0.5"
							/>
							Previous
						</span>
						<span className="mt-2 font-lora text-lg font-bold text-product-foreground transition-colors duration-200 group-hover:text-product-secondary">
							{prev.meta.title}
						</span>
					</Link>
				) : (
					<span aria-hidden className="hidden sm:block" />
				)}

				{next ? (
					<Link
						className="group flex flex-col items-end rounded-xl border border-product-border bg-product-background p-5 text-right transition-all duration-200 hover:-translate-y-0.5 hover:border-product-primary hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-product-primary focus-visible:ring-offset-2"
						href={`/docs/${next.meta.slug}`}
					>
						<span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-product-foreground-accent">
							Next
							<ArrowRight
								aria-hidden
								className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5"
							/>
						</span>
						<span className="mt-2 font-lora text-lg font-bold text-product-foreground transition-colors duration-200 group-hover:text-product-secondary">
							{next.meta.title}
						</span>
					</Link>
				) : (
					<span aria-hidden className="hidden sm:block" />
				)}
			</div>
		</nav>
	);
}
