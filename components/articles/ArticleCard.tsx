import { ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import type { ArticleMeta } from "@/content/articles/_types";

interface Props {
	meta: ArticleMeta;
	featured?: boolean;
	/** Small label shown above the title, e.g. "Editor's pick" on the featured card. */
	eyebrow?: string;
}

/**
 * Card used on the /articles index grid and in RelatedArticles. The image
 * zooms gently on hover, the card lifts, and a "Read" affordance slides in.
 * Featured renders a wider 2-column editorial layout.
 */
export default function ArticleCard({
	meta,
	featured = false,
	eyebrow,
}: Props) {
	const href = `/articles/${meta.slug}`;
	const date = new Date(meta.publishedAt).toLocaleDateString("en-US", {
		month: "short",
		day: "numeric",
		year: "numeric",
	});

	return (
		<Link
			className={`group relative block cursor-pointer overflow-hidden rounded-2xl border border-product-border bg-product-background shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${
				featured ? "md:grid md:grid-cols-2 md:items-stretch" : ""
			}`}
			href={href}
		>
			<div
				className={`relative overflow-hidden ${
					featured ? "aspect-[16/10] md:h-full" : "aspect-[16/9]"
				}`}
			>
				<Image
					alt={meta.heroImageAlt}
					className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
					fill
					sizes={
						featured
							? "(max-width: 768px) 100vw, 50vw"
							: "(max-width: 768px) 100vw, 33vw"
					}
					src={meta.heroImage}
				/>
				<div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
				<span className="absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-product-secondary backdrop-blur-sm">
					<span className="h-1.5 w-1.5 rounded-full bg-product-primary" />
					{meta.category}
				</span>
			</div>
			<div
				className={`flex flex-col p-5 ${
					featured ? "md:justify-center md:p-9" : ""
				}`}
			>
				{eyebrow && (
					<span className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-product-primary">
						<span className="text-product-secondary">{eyebrow}</span>
					</span>
				)}
				<h3
					className={`font-lora font-bold leading-snug text-product-foreground transition-colors group-hover:text-product-secondary ${
						featured ? "text-2xl md:text-3xl" : "text-xl"
					}`}
				>
					{meta.title}
				</h3>
				<p
					className={`mt-3 text-product-foreground-accent ${
						featured ? "line-clamp-3 text-base" : "line-clamp-2 text-[0.95rem]"
					}`}
				>
					{meta.description}
				</p>
				<div className="mt-5 flex items-center justify-between border-t border-product-border pt-4">
					<span className="text-xs font-medium uppercase tracking-wide text-product-foreground-accent">
						{date} · {meta.readingTimeMinutes} min read
					</span>
					<span className="inline-flex items-center gap-1 text-sm font-semibold text-product-secondary transition-all duration-300 group-hover:gap-2">
						Read <ArrowRight className="h-4 w-4" />
					</span>
				</div>
			</div>
		</Link>
	);
}
