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
 * Card used on the /docs index grid and in RelatedDocs. Mirrors ArticleCard:
 * the card lifts on hover and a "Read" affordance slides in. Docs lead with an
 * icon panel instead of a photo, since they are how-to topics, not posts.
 * Featured renders a wider two-column layout with a large amber icon panel.
 */
export default function DocCard({ meta, featured = false, eyebrow }: Props) {
	const href = `/docs/${meta.slug}`;
	const Icon = meta.icon;
	const label = eyebrow ?? meta.tag;

	if (featured) {
		return (
			<Link
				className="group grid overflow-hidden rounded-2xl border border-product-border bg-product-background shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl md:grid-cols-2"
				href={href}
			>
				<div className="flex items-center justify-center bg-product-background-hover p-10 md:h-full">
					<span className="flex h-20 w-20 items-center justify-center rounded-2xl bg-product-primary text-product-secondary shadow-md transition-transform duration-300 group-hover:scale-105">
						<Icon className="h-9 w-9" />
					</span>
				</div>
				<div className="flex flex-col justify-center p-8 md:p-9">
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
						<span className="inline-flex items-center gap-1 text-sm font-semibold text-product-secondary transition-all duration-300 group-hover:gap-2">
							Read <ArrowRight className="h-4 w-4" />
						</span>
					</div>
				</div>
			</Link>
		);
	}

	return (
		<Link
			className="group flex h-full flex-col rounded-2xl border border-product-border bg-product-background p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
			href={href}
		>
			<div className="mb-4 flex items-center gap-3">
				<span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-product-background-hover text-product-primary transition-colors group-hover:bg-product-primary group-hover:text-product-secondary">
					<Icon className="h-5 w-5" />
				</span>
				<span className="text-xs font-semibold uppercase tracking-[0.2em] text-product-secondary">
					{label}
				</span>
			</div>
			<h3 className="font-lora text-xl font-bold leading-snug text-product-foreground transition-colors group-hover:text-product-secondary">
				{meta.title}
			</h3>
			<p className="mt-2 line-clamp-2 text-[0.95rem] text-product-foreground-accent">
				{meta.description}
			</p>
			<div className="mt-5 flex items-center justify-between border-t border-product-border pt-4">
				<span className="text-xs font-medium uppercase tracking-wide text-product-foreground-accent">
					{meta.readingTimeMinutes} min read
				</span>
				<span className="inline-flex items-center gap-1 text-sm font-semibold text-product-secondary transition-all duration-300 group-hover:gap-2">
					Read <ArrowRight className="h-4 w-4" />
				</span>
			</div>
		</Link>
	);
}
