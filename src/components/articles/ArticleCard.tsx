import { Sparkles } from "lucide-react";
import Link from "next/link";

import { ArticleCover } from "@/components/articles/ArticleCover";
import { CategoryTag } from "@/components/resources/CategoryTag";
import { MetaLine } from "@/components/resources/MetaLine";
import { ReadMore } from "@/components/resources/ReadMore";
import type { ArticleMeta } from "@/content/articles/_types";
import { cn } from "@/lib/ui/cn";

interface Props {
	meta: ArticleMeta;
	featured?: boolean;
	/** Small label shown above the title, e.g. "Editor's pick" on the featured card. */
	eyebrow?: string;
}

/**
 * Card used on the /articles index and in "Keep reading". Featured renders a
 * wide row (cover | body) from 860px up.
 */
export function ArticleCard({ meta, featured = false, eyebrow }: Props) {
	return (
		<Link
			className={cn(
				"group flex flex-col overflow-hidden rounded-product-card border bg-product-card text-product-foreground shadow-product transition-[transform,box-shadow] duration-300 hover:-translate-y-1 hover:shadow-product-hover",
				featured
					? "border-product-primary/55 min-[860px]:flex-row"
					: "border-product-border",
			)}
			href={`/articles/${meta.slug}`}
		>
			<ArticleCover
				className={cn(
					"border-b border-product-border",
					featured
						? "aspect-video min-[860px]:aspect-auto min-[860px]:min-h-[340px] min-[860px]:flex-[0_0_52%] min-[860px]:border-b-0 min-[860px]:border-r"
						: "aspect-video",
				)}
				cover={meta.cover}
			/>
			<div
				className={cn(
					"flex flex-1 flex-col gap-2.5 px-[22px] py-5",
					featured &&
						"min-[860px]:justify-center min-[860px]:px-9 min-[860px]:py-[34px]",
				)}
			>
				{eyebrow && (
					<span className="inline-flex items-center gap-1.5 text-[13px] font-bold text-product-primary-ink">
						<Sparkles aria-hidden="true" className="h-3.5 w-3.5" />
						{eyebrow}
					</span>
				)}
				<CategoryTag>{meta.category}</CategoryTag>
				<h3
					className={cn(
						"text-product-foreground",
						featured
							? "text-[clamp(22px,2.6vw,32px)] font-extrabold leading-[1.15] tracking-[-0.028em]"
							: "text-[19px] font-bold leading-[1.28] tracking-[-0.015em]",
					)}
				>
					{meta.title}
				</h3>
				<p
					className={cn(
						"leading-[1.6] text-product-foreground-accent",
						featured ? "text-base" : "text-[15px]",
					)}
				>
					{meta.description}
				</p>
				<span className="mt-auto flex flex-wrap items-center justify-between gap-x-3 gap-y-2 pt-1.5">
					<MetaLine
						publishedAt={meta.publishedAt}
						readingTimeMinutes={meta.readingTimeMinutes}
					/>
					<ReadMore />
				</span>
			</div>
		</Link>
	);
}
