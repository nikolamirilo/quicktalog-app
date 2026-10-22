import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";

import { linkCardClass } from "@/components/resources/LinkCard";
import type { DocEntry } from "@/content/docs/_types";
import { cn } from "@/lib/ui/cn";

const card = cn(linkCardClass, "group flex flex-col gap-1 px-[18px] py-4");

/**
 * Previous / next cards at the foot of a doc. The last doc's "Next" goes back
 * to the docs index.
 */
export function DocPager({ prev, next }: { prev?: DocEntry; next?: DocEntry }) {
	return (
		<nav
			aria-label="Previous and next docs"
			className="mt-[22px] grid grid-cols-1 gap-3 sm:grid-cols-2"
		>
			{prev ? (
				<Link className={card} href={`/docs/${prev.meta.slug}`} rel="prev">
					<small className="inline-flex items-center gap-1 text-[13px] font-semibold text-product-muted">
						<ChevronLeft aria-hidden="true" className="h-3.5 w-3.5" />
						Previous
					</small>
					<b className="font-product-heading text-base font-bold leading-[1.3] text-product-foreground">
						{prev.meta.title}
					</b>
				</Link>
			) : (
				<span aria-hidden="true" className="hidden sm:block" />
			)}
			<Link
				className={cn(card, "items-end text-right")}
				href={next ? `/docs/${next.meta.slug}` : "/docs"}
				rel={next ? "next" : undefined}
			>
				<small className="inline-flex items-center gap-1 text-[13px] font-semibold text-product-muted">
					{next ? "Next" : "Back to"}
					<ChevronRight aria-hidden="true" className="h-3.5 w-3.5" />
				</small>
				<b className="font-product-heading text-base font-bold leading-[1.3] text-product-foreground">
					{next ? next.meta.title : "All docs"}
				</b>
			</Link>
		</nav>
	);
}
