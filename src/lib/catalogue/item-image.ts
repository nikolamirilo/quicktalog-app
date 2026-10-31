import { DEFAULT_IMAGE } from "@quicktalog/common";

/** Written into items by the old lookup whenever a search failed; still in those catalogues. */
export const UNSPLASH_MISS =
	"https://static1.squarespace.com/static/5898e29c725e25e7132d5a5a/58aa11bc9656ca13c4524c68/58aa11e99656ca13c45253e2/1487540713345/600x400-Image-Placeholder.jpg?format=original";

/** Stand-ins a card can show: the item reads as illustrated but has no photo of its own. */
const PLACEHOLDERS = new Set<string>([DEFAULT_IMAGE, UNSPLASH_MISS]);

/**
 * Whether an item has a photo of its own. The template image and the Unsplash
 * miss are not photos: counting them as one is what made the assistant skip an
 * item when asked to fill in the pictures that are missing.
 */
export const hasItemPhoto = (image?: string | null): boolean => {
	const url = image?.trim();
	return Boolean(url) && !PLACEHOLDERS.has(url as string);
};
