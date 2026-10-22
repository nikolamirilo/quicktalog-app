import type { ReactNode } from "react";

type ArticleCategory = "Use cases" | "Guides" | "Comparisons" | "Product";

/** The CSS illustration drawn on the article's card and page header. */
export type ArticleCoverName =
	| "restaurants"
	| "salons"
	| "ai"
	| "qr"
	| "alternatives"
	| "businesses";

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
	/** Illustration on the card and header; the plain amber cover when unset. */
	cover?: ArticleCoverName;
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
