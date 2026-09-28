import type { Article } from "@/content/articles/_types";
import ArticleCard from "./ArticleCard";

/** Two to three related posts shown at the foot of an article. */
export default function RelatedArticles({ articles }: { articles: Article[] }) {
	if (!articles.length) return null;

	return (
		<section className="mx-auto mt-20 max-w-5xl px-4">
			<div className="mb-8">
				<span className="text-xs font-semibold uppercase tracking-[0.2em] text-product-secondary">
					Keep reading
				</span>
				<h2 className="mt-2 font-lora text-3xl font-bold text-product-foreground">
					More guides for you
				</h2>
			</div>
			<div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
				{articles.map((article) => (
					<ArticleCard key={article.meta.slug} meta={article.meta} />
				))}
			</div>
		</section>
	);
}
