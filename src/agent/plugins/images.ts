import type { ItemInput } from "@/agent/core/schemas";
import { findStockPhoto } from "@/lib/images/stock-photo";
import type { AiItemInput } from "@/types/ai";

/** A search still running by now is a miss: the whole turn has 60 seconds. */
const LOOKUP_TIMEOUT_MS = 5000;
/** Plenty for a long listing, and a bound on a page made of nothing but pictures. */
const MAX_PICTURES = 300;

export interface ImageCache {
	/** Stock photo searches by query, null when one found nothing. */
	searches: Map<string, string | null>;
	/** Pictures on pages read this turn: marker N is `pictures[N - 1]`. */
	pictures: string[];
	/** Why no search can succeed this turn, once one has proved it. */
	unavailable: string | null;
}

export const createImageCache = (): ImageCache => ({
	searches: new Map(),
	pictures: [],
	unavailable: null,
});

/** The same address keeps its number, so a page read twice still points right. */
export function registerPicture(
	cache: ImageCache,
	url: string,
): number | undefined {
	const existing = cache.pictures.indexOf(url);
	if (existing !== -1) return existing + 1;
	if (cache.pictures.length >= MAX_PICTURES) return undefined;

	cache.pictures.push(url);
	return cache.pictures.length;
}

/** Unknown numbers, and the 0 a model sends for "none", resolve to nothing. */
const pictureFor = (cache: ImageCache, ref?: number): string | undefined =>
	ref ? cache.pictures[ref - 1] : undefined;

/** Settles with null once `ms` pass, so one hung search cannot stall the call. */
async function withTimeout<T>(work: Promise<T>, ms: number): Promise<T | null> {
	let timer: ReturnType<typeof setTimeout> | undefined;
	try {
		return await Promise.race([
			work,
			new Promise<null>((resolve) => {
				timer = setTimeout(() => resolve(null), ms);
			}),
		]);
	} finally {
		clearTimeout(timer);
	}
}

async function lookup(
	cache: ImageCache,
	query: string,
): Promise<string | null> {
	const cached = cache.searches.get(query);
	if (cached !== undefined) return cached;
	// Every further request would be refused the same way, and a rate limit the
	// agent keeps hammering is how one ask spends the whole hour's quota.
	if (cache.unavailable) return null;

	const result = await withTimeout(findStockPhoto(query), LOOKUP_TIMEOUT_MS);
	if (!result) {
		cache.unavailable = "The stock photo service did not answer in time.";
		return null;
	}
	if (result.status === "unavailable") {
		cache.unavailable = result.reason;
		return null;
	}

	const resolved = result.status === "found" ? result.url : null;
	cache.searches.set(query, resolved);
	return resolved;
}

type ImageRequest = Pick<ItemInput, "pageImage" | "imageQuery">;

/**
 * Runs every search a batch needs, each distinct query once. The schema caps
 * the batch size, so all of them run rather than a silent first few.
 */
async function warmSearches(
	cache: ImageCache,
	requests: ImageRequest[],
): Promise<void> {
	// A page picture needs no search.
	const queries = [
		...new Set(
			requests
				.filter((request) => !pictureFor(cache, request.pageImage))
				.map((request) => request.imageQuery)
				.filter((query): query is string => !!query),
		),
	];

	// The first search goes alone: a rate-limited service then costs one refused
	// request, not one per item, and the rest of the batch never leaves.
	const [probe, ...rest] = queries;
	if (probe === undefined) return;
	await lookup(cache, probe);
	if (cache.unavailable) return;

	await Promise.all(rest.map((query) => lookup(cache, query)));
}

/** Resolves pictures and queries to URLs and mints the ids the browser will reuse. */
export async function resolveItems(
	cache: ImageCache,
	items: ItemInput[],
): Promise<{ items: AiItemInput[]; misses: string[] }> {
	await warmSearches(cache, items);

	const misses: string[] = [];
	// `strict: false` makes zod infer every field optional, so rebuild explicitly.
	const resolved: AiItemInput[] = items
		.filter((item) => Boolean(item?.name))
		.map((item) => {
			const image =
				pictureFor(cache, item.pageImage) ??
				(item.imageQuery ? cache.searches.get(item.imageQuery) : null);
			// A search is named by its query, a missing page picture by its item.
			const wanted = item.imageQuery || (item.pageImage ? item.name : "");
			if (wanted && !image && !misses.includes(wanted)) {
				misses.push(wanted);
			}
			return {
				id: crypto.randomUUID(),
				name: item.name,
				description: item.description,
				price: item.price,
				isFree: item.isFree,
				denominator: item.denominator,
				...(image ? { image } : {}),
			};
		});

	return { items: resolved, misses };
}

export async function resolveImage(
	cache: ImageCache,
	{ pageImage, imageQuery }: ImageRequest,
): Promise<string | null> {
	const picture = pictureFor(cache, pageImage);
	if (picture) return picture;
	return imageQuery ? lookup(cache, imageQuery) : null;
}

/**
 * What a tool result says about photos that did not land. A service that could
 * not be searched is said once, instead of a miss per item that reads as
 * "nothing matched" and invites the agent to retry with other words.
 */
export const photoTrouble = (
	cache: ImageCache,
	misses: string[],
): { imagesUnavailable?: string; imageMisses?: string[] } => {
	if (cache.unavailable) return { imagesUnavailable: cache.unavailable };
	return misses.length > 0 ? { imageMisses: misses } : {};
};

/** One photo per request, in the order asked, for filling in a whole section at once. */
export async function resolveImages(
	cache: ImageCache,
	requests: ImageRequest[],
): Promise<(string | null)[]> {
	await warmSearches(cache, requests);
	return Promise.all(requests.map((request) => resolveImage(cache, request)));
}
