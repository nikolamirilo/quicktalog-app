import type { Article } from "@/content/articles/_types";
import { articles } from "@/content/articles/registry";

/** All articles, newest first. */
export const getAllArticles = (): Article[] =>
	[...articles].sort(
		(a, b) =>
			new Date(b.meta.publishedAt).getTime() -
			new Date(a.meta.publishedAt).getTime(),
	);

/** Every known slug, used by generateStaticParams and the sitemap. */
export const getAllSlugs = (): string[] => articles.map((a) => a.meta.slug);

export const getArticleBySlug = (slug: string): Article | undefined =>
	articles.find((a) => a.meta.slug === slug);

/**
 * Related articles for a given slug. Prefers the article's own relatedSlugs,
 * then fills any remaining spots with others in the same category.
 */
export const getRelatedArticles = (slug: string, limit = 2): Article[] => {
	const current = getArticleBySlug(slug);
	if (!current) return [];

	const result: Article[] = [];

	for (const related of current.meta.relatedSlugs ?? []) {
		const match = getArticleBySlug(related);
		if (match && !result.find((r) => r.meta.slug === match.meta.slug)) {
			result.push(match);
		}
	}

	if (result.length < limit) {
		const sameCategory = articles.filter(
			(a) => a.meta.slug !== slug && a.meta.category === current.meta.category,
		);
		for (const candidate of sameCategory) {
			if (result.length >= limit) break;
			if (!result.find((r) => r.meta.slug === candidate.meta.slug)) {
				result.push(candidate);
			}
		}
	}

	return result.slice(0, limit);
};
