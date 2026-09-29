import { ArticleCard } from "@/components/articles/ArticleCard";
import { Container } from "@/components/general/Container";
import { SectionHeading } from "@/components/general/SectionHeading";
import type { Article } from "@/content/articles/_types";

/** Related posts shown at the foot of an article. */
export function RelatedArticles({ articles }: { articles: Article[] }) {
	if (!articles.length) return null;

	return (
		<section aria-labelledby="related-articles-heading" className="pb-6 pt-16">
			<Container>
				<SectionHeading
					align="left"
					className="mb-[22px]"
					eyebrow="Keep reading"
					id="related-articles-heading"
					size="sm"
					title="More guides for you"
				/>
				<div className="grid grid-cols-1 gap-[18px] md:grid-cols-2 lg:grid-cols-3 lg:gap-[22px]">
					{articles.map((article) => (
						<ArticleCard key={article.meta.slug} meta={article.meta} />
					))}
				</div>
			</Container>
		</section>
	);
}
