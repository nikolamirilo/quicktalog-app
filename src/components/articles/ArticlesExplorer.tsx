"use client";

import { useMemo, useState } from "react";

import { ArticleCard } from "@/components/articles/ArticleCard";
import { FilterChip } from "@/components/general/FilterChip";
import type { ArticleMeta } from "@/content/articles/_types";

const ALL = "All";

const countLabel = (count: number) =>
	`${count} ${count === 1 ? "article" : "articles"}`;

/**
 * Client-side category filter for the articles grid. The featured article is
 * pinned above this on the server and is not part of `articles`, so the chips
 * and the status only count what the grid can show.
 */
export function ArticlesExplorer({ articles }: { articles: ArticleMeta[] }) {
	const categories = useMemo(
		() => [ALL, ...Array.from(new Set(articles.map((m) => m.category)))],
		[articles],
	);
	const [active, setActive] = useState(ALL);
	const filtered =
		active === ALL ? articles : articles.filter((m) => m.category === active);

	const status =
		active === ALL
			? `Showing all ${countLabel(filtered.length)} below the editor's pick`
			: `Showing ${countLabel(filtered.length)} in ${active}`;

	return (
		<div>
			{categories.length > 2 ? (
				<div
					aria-label="Filter articles by category"
					className="-mx-5 mb-[22px] flex gap-2 overflow-x-auto px-5 pb-1.5 pt-0.5 [scrollbar-width:none] md:mx-0 md:flex-wrap md:overflow-visible md:px-0 [&::-webkit-scrollbar]:hidden"
					role="group"
				>
					{categories.map((category) => (
						<FilterChip
							key={category}
							onClick={() => setActive(category)}
							pressed={category === active}
						>
							{category}
						</FilterChip>
					))}
				</div>
			) : null}
			<p aria-live="polite" className="sr-only" role="status">
				{status}
			</p>
			<div className="grid grid-cols-1 gap-[18px] md:grid-cols-2 lg:grid-cols-3 lg:gap-[22px]">
				{filtered.map((meta) => (
					<ArticleCard key={meta.slug} meta={meta} />
				))}
			</div>
		</div>
	);
}
