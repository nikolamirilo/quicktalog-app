import { ArrowRight } from "lucide-react";
import Link from "next/link";
import type { DocMeta } from "@/content/docs/_types";

interface Props {
	meta: DocMeta;
	featured?: boolean;
	/** Small label shown above the title, overrides the topic tag. */
	eyebrow?: string;
}

/**
 * Card used on the /docs index grid and in RelatedDocs. Styled like a crisp
 * documentation card: a subtle border-color shift and lift on hover, with a
 * "Read" affordance that nudges right. Docs lead with an icon panel instead of
 * a photo, since they are how-to topics, not posts. Featured renders a wider
 * two-column layout with a large amber icon panel.
 */
export default function DocCard({ meta, featured = false, eyebrow }: Props) {
	const href = `/docs/${meta.slug}`;
	const Icon = meta.icon;
	const label = eyebrow ?? meta.tag;

	if (featured) {
		return (
			<Link
				className="group grid overflow-hidden rounded-xl border border-product-border bg-product-background transition-all duration-200 hover:-translate-y-0.5 hover:border-product-primary hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-product-primary focus-visible:ring-offset-2 md:grid-cols-2"
				href={href}
			>
				<div className="flex items-center justify-center bg-product-background-hover p-10 md:h-full">
					<span className="flex h-20 w-20 items-center justify-center rounded-xl bg-product-primary text-product-secondary shadow-sm transition-transform duration-200 group-hover:scale-105">
						<Icon aria-hidden className="h-9 w-9" />
					</span>
				</div>
				<div className="flex flex-col justify-center p-6 md:p-8">
					<span className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-product-secondary">
						{label}
					</span>
					<h3 className="font-lora text-2xl font-bold leading-snug text-product-foreground transition-colors group-hover:text-product-secondary md:text-3xl">
						{meta.title}
					</h3>
					<p className="mt-3 line-clamp-3 text-product-foreground-accent">
						{meta.description}
					</p>
					<div className="mt-5 flex items-center justify-between border-t border-product-border pt-4">
						<span className="text-xs font-medium uppercase tracking-wide text-product-foreground-accent">
							{meta.readingTimeMinutes} min read
						</span>
						<span className="inline-flex items-center gap-1 text-sm font-semibold text-product-secondary transition-all duration-200 group-hover:gap-2">
							Read <ArrowRight aria-hidden className="h-4 w-4" />
						</span>
					</div>
				</div>
			</Link>
		);
	}

	return (
		<Link
			className="group flex h-full flex-col rounded-xl border border-product-border bg-product-background p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-product-primary hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-product-primary focus-visible:ring-offset-2 sm:p-6"
			href={href}
		>
			<div className="mb-4 flex items-center gap-3">
				<span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-lg bg-product-background-hover text-product-primary transition-colors group-hover:bg-product-primary group-hover:text-product-secondary">
					<Icon aria-hidden className="h-5 w-5" />
				</span>
				<span className="text-xs font-semibold uppercase tracking-[0.2em] text-product-secondary">
					{label}
				</span>
			</div>
			<h3 className="font-lora text-xl font-bold leading-snug text-product-foreground transition-colors group-hover:text-product-secondary">
				{meta.title}
			</h3>
			<p className="mt-2 line-clamp-2 text-[0.95rem] leading-relaxed text-product-foreground-accent">
				{meta.description}
			</p>
			<div className="mt-auto flex items-center justify-between border-t border-product-border pt-4">
				<span className="text-xs font-medium uppercase tracking-wide text-product-foreground-accent">
					{meta.readingTimeMinutes} min read
				</span>
				<span className="inline-flex items-center gap-1 text-sm font-semibold text-product-secondary transition-all duration-200 group-hover:gap-2">
					Read <ArrowRight aria-hidden className="h-4 w-4" />
				</span>
			</div>
		</Link>
	);
}
