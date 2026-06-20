import type { DocEntry } from "@/content/docs/_types";
import { docs } from "@/content/docs/registry";

/** All docs topics, in reading order. */
export const getAllDocs = (): DocEntry[] =>
	[...docs].sort((a, b) => a.meta.order - b.meta.order);

/** Every known slug, used by generateStaticParams and the sitemap. */
export const getAllDocSlugs = (): string[] =>
	getAllDocs().map((d) => d.meta.slug);

export const getDocBySlug = (slug: string): DocEntry | undefined =>
	docs.find((d) => d.meta.slug === slug);

/**
 * Related topics for a given slug. Prefers the topic's own relatedSlugs, then
 * fills any remaining spots with the next topics in reading order.
 */
export const getRelatedDocs = (slug: string, limit = 3): DocEntry[] => {
	const current = getDocBySlug(slug);
	if (!current) return [];

	const result: DocEntry[] = [];

	for (const related of current.meta.relatedSlugs ?? []) {
		const match = getDocBySlug(related);
		if (match && !result.find((r) => r.meta.slug === match.meta.slug)) {
			result.push(match);
		}
	}

	if (result.length < limit) {
		const ordered = getAllDocs().filter((d) => d.meta.slug !== slug);
		for (const candidate of ordered) {
			if (result.length >= limit) break;
			if (!result.find((r) => r.meta.slug === candidate.meta.slug)) {
				result.push(candidate);
			}
		}
	}

	return result.slice(0, limit);
};

/** Previous and next topics in reading order, for the topic-page pager. */
export const getAdjacentDocs = (
	slug: string,
): { prev?: DocEntry; next?: DocEntry } => {
	const ordered = getAllDocs();
	const index = ordered.findIndex((d) => d.meta.slug === slug);
	if (index === -1) return {};
	return {
		prev: index > 0 ? ordered[index - 1] : undefined,
		next: index < ordered.length - 1 ? ordered[index + 1] : undefined,
	};
};
