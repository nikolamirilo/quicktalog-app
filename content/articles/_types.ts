import type { ReactNode } from "react";

export type ArticleCategory =
	| "Use cases"
	| "Guides"
	| "Comparisons"
	| "Product";

export interface ArticleMeta {
	/** URL segment, e.g. "digital-menu-for-restaurants" */
	slug: string;
	/** H1 + <title> */
	title: string;
	/** Meta description + card excerpt (aim for 150-160 chars) */
	description: string;
	category: ArticleCategory;
	/** Primary + secondary keywords */
	keywords: string[];
	/** /public path or remote https URL */
	heroImage: string;
	heroImageAlt: string;
	/** Optional credit for stock photos */
	heroCredit?: { name: string; url: string };
	/** ISO date, e.g. "2026-06-19" */
	publishedAt: string;
	/** ISO date */
	updatedAt?: string;
	readingTimeMinutes: number;
	author: string;
	/** Pin on the index page */
	featured?: boolean;
	/** Manual related links (slugs) */
	relatedSlugs?: string[];
}

export interface Article {
	meta: ArticleMeta;
	Body: () => ReactNode;
}
