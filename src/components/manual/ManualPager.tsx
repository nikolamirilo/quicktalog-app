import { ArrowLeft, ArrowRight } from "lucide-react";
import Link from "next/link";

import type { ManualPageMeta } from "@/content/manual/_types";
import { manualHref } from "@/lib/content/manual";

/** Previous and next pages in reading order. */
export function ManualPager({
	prev,
	next,
}: {
	prev?: ManualPageMeta;
	next?: ManualPageMeta;
}) {
	if (!prev && !next) return null;

	return (
		<nav
			aria-label="More of the manual"
			className="mt-10 grid gap-3 border-t border-product-border pt-6 sm:grid-cols-2"
		>
			{prev ? (
				<Link
					className="group flex items-center gap-2.5 rounded-product-card border border-product-border bg-product-card p-3.5 transition-colors hover:border-product-primary/60"
					href={manualHref(prev.slug)}
				>
					<ArrowLeft
						aria-hidden="true"
						className="h-4 w-4 flex-none text-product-muted transition-transform group-hover:-translate-x-[3px]"
					/>
					<span className="min-w-0">
						<span className="block text-[12px] font-bold uppercase tracking-[0.04em] text-product-muted">
							Previous
						</span>
						<span className="block truncate font-semibold text-product-foreground">
							{prev.title}
						</span>
					</span>
				</Link>
			) : (
				<span />
			)}
			{next ? (
				<Link
					className="group flex items-center gap-2.5 rounded-product-card border border-product-border bg-product-card p-3.5 text-right transition-colors hover:border-product-primary/60 sm:justify-end"
					href={manualHref(next.slug)}
				>
					<span className="min-w-0">
						<span className="block text-[12px] font-bold uppercase tracking-[0.04em] text-product-muted">
							Next
						</span>
						<span className="block truncate font-semibold text-product-foreground">
							{next.title}
						</span>
					</span>
					<ArrowRight
						aria-hidden="true"
						className="h-4 w-4 flex-none text-product-muted transition-transform group-hover:translate-x-[3px]"
					/>
				</Link>
			) : null}
		</nav>
	);
}
