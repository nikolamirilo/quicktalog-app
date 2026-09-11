import type { ItemInput } from "@/agent/schemas";
import type { AiItemInput } from "@/types/ai";
import { fetchImageFromUnsplash } from "@quicktalog/common";

const MAX_IMAGE_LOOKUPS = 24;

/** What Unsplash resolves to on an empty search; treat it as "not found". */
const UNSPLASH_MISS =
	"https://static1.squarespace.com/static/5898e29c725e25e7132d5a5a/58aa11bc9656ca13c4524c68/58aa11e99656ca13c45253e2/1487540713345/600x400-Image-Placeholder.jpg?format=original";

export type ImageCache = Map<string, string | null>;

export const createImageCache = (): ImageCache => new Map();

async function lookup(
	cache: ImageCache,
	query: string,
): Promise<string | null> {
	const cached = cache.get(query);
	if (cached !== undefined) return cached;

	const url = await fetchImageFromUnsplash(query);
	const resolved = url && url !== UNSPLASH_MISS ? url : null;
	cache.set(query, resolved);
	return resolved;
}

/** Resolves queries to URLs and mints the ids the browser will reuse. */
export async function resolveItems(
	cache: ImageCache,
	items: ItemInput[],
): Promise<{ items: AiItemInput[]; misses: string[] }> {
	const queries = [
		...new Set(
			items.map((item) => item.imageQuery).filter((q): q is string => !!q),
		),
	].slice(0, MAX_IMAGE_LOOKUPS);

	await Promise.all(queries.map((query) => lookup(cache, query)));

	const misses: string[] = [];
	// `strict: false` makes zod infer every field optional, so rebuild explicitly.
	const resolved: AiItemInput[] = items
		.filter((item) => Boolean(item?.name))
		.map((item) => {
			const image = item.imageQuery ? cache.get(item.imageQuery) : null;
			if (item.imageQuery && !image && !misses.includes(item.imageQuery)) {
				misses.push(item.imageQuery);
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
	query: string,
): Promise<string | null> {
	return lookup(cache, query);
}
