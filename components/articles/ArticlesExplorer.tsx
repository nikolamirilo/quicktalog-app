"use client";

import { useMemo, useState } from "react";
import type { ArticleMeta } from "@/content/articles/_types";
import ArticleCard from "./ArticleCard";

/**
 * Client-side category filter for the articles index. The featured article is
 * pinned above this on the server, so it is excluded here to avoid duplication.
 */
export default function ArticlesExplorer({
	metas,
	featuredSlug,
}: {
	metas: ArticleMeta[];
	featuredSlug: string;
}) {
	const rest = useMemo(
		() => metas.filter((m) => m.slug !== featuredSlug),
		[metas, featuredSlug],
	);
	const categories = useMemo(
		() => ["All", ...Array.from(new Set(rest.map((m) => m.category)))],
		[rest],
	);
	const [active, setActive] = useState("All");
	const filtered =
		active === "All" ? rest : rest.filter((m) => m.category === active);

	return (
		<div className="mt-12">
			<div className="mb-10 flex flex-wrap justify-center gap-2">
				{categories.map((category) => {
					const isActive = category === active;
					return (
						<button
							className={`cursor-pointer rounded-full border px-4 py-2 text-sm font-medium transition-colors duration-200 ${
								isActive
									? "border-product-secondary bg-product-secondary text-white"
									: "border-product-border bg-product-background text-product-foreground-accent hover:border-product-secondary hover:text-product-foreground"
							}`}
							key={category}
							onClick={() => setActive(category)}
							type="button"
						>
							{category}
						</button>
					);
				})}
			</div>
			<div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
				{filtered.map((meta) => (
					<ArticleCard key={meta.slug} meta={meta} />
				))}
			</div>
		</div>
	);
}
