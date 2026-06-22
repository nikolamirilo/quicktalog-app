import type { ReactNode } from "react";
import type { IconType } from "react-icons";

export interface DocMeta {
	/** URL segment, e.g. "create-a-catalogue" */
	slug: string;
	/** H1 + <title> */
	title: string;
	/** Meta description + card excerpt (aim for 150-160 chars) */
	description: string;
	/** Short label shown above the title on cards, e.g. "Start here" */
	tag: string;
	/** Icon used on the card and the topic hero */
	icon: IconType;
	/** Order in the docs sequence, starting at 1 */
	order: number;
	/** Rough minutes to read */
	readingTimeMinutes: number;
	/** Primary + secondary keywords for SEO */
	keywords: string[];
	/** Manual related links (slugs). Falls back to neighbours by order. */
	relatedSlugs?: string[];
	/** Cover image shown on the card and at the top of the doc body. */
	coverImage?: string;
}

export interface DocEntry {
	meta: DocMeta;
	Body: () => ReactNode;
}
