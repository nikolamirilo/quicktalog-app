import type { ItemInput } from "@/agent/schemas";
import type { AiItemInput } from "@/types/ai";
import { fetchImageFromUnsplash } from "@quicktalog/common";

/** A search still running by now is a miss: the whole turn has 60 seconds. */
const LOOKUP_TIMEOUT_MS = 5000;
/** Plenty for a long listing, and a bound on a page made of nothing but pictures. */
const MAX_PICTURES = 300;

/** What Unsplash resolves to on an empty search; treat it as "not found". */
const UNSPLASH_MISS =
	"https://static1.squarespace.com/static/5898e29c725e25e7132d5a5a/58aa11bc9656ca13c4524c68/58aa11e99656ca13c45253e2/1487540713345/600x400-Image-Placeholder.jpg?format=original";

export interface ImageCache {
	/** Stock photo searches by query, null when one found nothing. */
	searches: Map<string, string | null>;
	/** Pictures on pages read this turn: marker N is `pictures[N - 1]`. */
	pictures: string[];
}

export const createImageCache = (): ImageCache => ({
	searches: new Map(),
	pictures: [],
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

	const url = await withTimeout(
		fetchImageFromUnsplash(query),
		LOOKUP_TIMEOUT_MS,
	);
	const resolved = url && url !== UNSPLASH_MISS ? url : null;
	cache.searches.set(query, resolved);
	return resolved;
}

/** Resolves pictures and queries to URLs and mints the ids the browser will reuse. */
export async function resolveItems(
	cache: ImageCache,
	items: ItemInput[],
): Promise<{ items: AiItemInput[]; misses: string[] }> {
	// A page picture needs no search. The schema caps the item count, so every
	// remaining query runs rather than a silent first few.
	const queries = [
		...new Set(
			items
				.filter((item) => !pictureFor(cache, item.pageImage))
				.map((item) => item.imageQuery)
				.filter((q): q is string => !!q),
		),
	];

	await Promise.all(queries.map((query) => lookup(cache, query)));

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
	{ pageImage, imageQuery }: Pick<ItemInput, "pageImage" | "imageQuery">,
): Promise<string | null> {
	const picture = pictureFor(cache, pageImage);
	if (picture) return picture;
	return imageQuery ? lookup(cache, imageQuery) : null;
}
