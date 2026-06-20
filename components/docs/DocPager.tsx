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
			className="mt-16 grid gap-4 sm:grid-cols-2"
		>
			{prev ? (
				<Link
					className="group flex flex-col rounded-2xl border border-product-border bg-product-background p-5 transition-all hover:-translate-y-0.5 hover:border-product-primary hover:shadow-md"
					href={`/docs/${prev.meta.slug}`}
				>
					<span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-product-foreground-accent">
						<ArrowLeft className="h-4 w-4" /> Previous
					</span>
					<span className="mt-1.5 font-lora text-lg font-bold text-product-foreground transition-colors group-hover:text-product-secondary">
						{prev.meta.title}
					</span>
				</Link>
			) : (
				<span aria-hidden className="hidden sm:block" />
			)}

			{next ? (
				<Link
					className="group flex flex-col items-end rounded-2xl border border-product-border bg-product-background p-5 text-right transition-all hover:-translate-y-0.5 hover:border-product-primary hover:shadow-md"
					href={`/docs/${next.meta.slug}`}
				>
					<span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-product-foreground-accent">
						Next <ArrowRight className="h-4 w-4" />
					</span>
					<span className="mt-1.5 font-lora text-lg font-bold text-product-foreground transition-colors group-hover:text-product-secondary">
						{next.meta.title}
					</span>
				</Link>
			) : (
				<span aria-hidden className="hidden sm:block" />
			)}
		</nav>
	);
}
