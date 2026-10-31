import type {
	ManualGroup,
	ManualPage,
	ManualPageMeta,
} from "@/content/manual/_types";
import { manualGroups } from "@/content/manual/groups";
import { manualPages, manualPopularSlugs } from "@/content/manual/registry";

/** Where the manual lives. The first page is served at this path itself. */
export const MANUAL_BASE = "/docs";

/** All pages, in reading order. */
export const getManualPages = (): ManualPage[] => manualPages;

export const getManualGroups = (): ManualGroup[] => manualGroups;

/** The first page in reading order, served at the manual's own path. */
export const getManualHomeSlug = (): string | undefined =>
	manualPages[0]?.meta.slug;

export const manualHref = (slug: string): string =>
	slug === getManualHomeSlug() ? MANUAL_BASE : `${MANUAL_BASE}/${slug}`;

/** Every slug except the first, which is the manual's index route. */
export const getManualSubSlugs = (): string[] =>
	manualPages.slice(1).map((page) => page.meta.slug);

export const getManualPage = (slug: string): ManualPage | undefined =>
	manualPages.find((page) => page.meta.slug === slug);

/** The pages worth offering first, for the search box and the Help Center. */
export const getManualPopularPages = (): ManualPage[] =>
	manualPopularSlugs
		.map(getManualPage)
		.filter((page): page is ManualPage => page !== undefined);

export interface ManualNavGroup {
	group: ManualGroup;
	pages: ManualPageMeta[];
}

/** The sidebar: every module that has pages, each with its pages in order. */
export const getManualNav = (): ManualNavGroup[] =>
	manualGroups
		.map((group) => ({
			group,
			pages: manualPages
				.filter((page) => page.meta.group === group.id)
				.map((page) => page.meta),
		}))
		.filter((entry) => entry.pages.length > 0);

export const getManualGroup = (page: ManualPageMeta): ManualGroup | undefined =>
	manualGroups.find((group) => group.id === page.group);

/** Previous and next pages in reading order, for the pager. */
export const getAdjacentManualPages = (
	slug: string,
): { prev?: ManualPageMeta; next?: ManualPageMeta } => {
	const index = manualPages.findIndex((page) => page.meta.slug === slug);
	if (index === -1) return {};
	return {
		next: manualPages[index + 1]?.meta,
		prev: manualPages[index - 1]?.meta,
	};
};

/**
 * Related pages: the ones the page names, then others from the same module to
 * fill the row.
 */
export const getRelatedManualPages = (
	slug: string,
	limit = 3,
): ManualPageMeta[] => {
	const current = getManualPage(slug);
	if (!current) return [];

	const result: ManualPageMeta[] = [];
	const add = (meta?: ManualPageMeta) => {
		if (!meta) return;
		if (meta.slug === slug) return;
		if (result.some((item) => item.slug === meta.slug)) return;
		result.push(meta);
	};

	for (const related of current.meta.related ?? []) {
		add(getManualPage(related)?.meta);
	}
	for (const page of manualPages) {
		if (result.length >= limit) break;
		if (page.meta.group === current.meta.group) add(page.meta);
	}

	return result.slice(0, limit);
};

export interface ManualSearchEntry {
	slug: string;
	href: string;
	title: string;
	group: string;
	inShort: string;
	/** Title, keywords and the words readers type, lowercased for matching. */
	terms: string;
}

/**
 * The search index, built once from the registry. It includes synonyms so a
 * reader who types "menu" finds the page the docs call "items".
 */
export const getManualSearchIndex = (): ManualSearchEntry[] =>
	manualPages.map(({ meta }) => ({
		group: getManualGroup(meta)?.title ?? "",
		href: manualHref(meta.slug),
		inShort: meta.inShort,
		slug: meta.slug,
		terms: [
			meta.title,
			meta.inShort,
			...(meta.keywords ?? []),
			...(meta.synonyms ?? []),
		]
			.join(" ")
			.toLowerCase(),
		title: meta.title,
	}));
