import Link from "next/link";

import type { ManualPageMeta } from "@/content/manual/_types";
import { manualHref } from "@/lib/content/manual";

export function RelatedManualPages({ pages }: { pages: ManualPageMeta[] }) {
	if (pages.length === 0) return null;

	return (
		<section className="mt-9">
			<h2 className="font-product-heading text-[17px] font-extrabold text-product-foreground">
				Related pages
			</h2>
			<ul className="mt-3 grid gap-2.5 sm:grid-cols-2">
				{pages.map((page) => (
					<li key={page.slug}>
						<Link
							className="block h-full rounded-product-card border border-product-border bg-product-card p-3.5 transition-colors hover:border-product-primary/60"
							href={manualHref(page.slug)}
						>
							<span className="block font-semibold text-product-foreground">
								{page.title}
							</span>
							<span className="mt-0.5 block text-[14px] text-product-foreground-accent">
								{page.inShort}
							</span>
						</Link>
					</li>
				))}
			</ul>
		</section>
	);
}
