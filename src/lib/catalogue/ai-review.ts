import type { Catalogue, ContentBlock, Item } from "@quicktalog/common";
import { isItemsBlock, normalizeContent } from "@/lib/catalogue/content-blocks";

/** What an open AI review covers on the page, by id. */
export interface AiReviewDiff {
	/** Sections the AI added, or whose own settings (name, layout...) it changed. */
	sectionIds: string[];
	/** Items the AI added or edited, wherever they are now. */
	itemIds: string[];
}

const itemsOf = (block: ContentBlock): Item[] =>
	isItemsBlock(block) ? ((block as { items?: Item[] }).items ?? []) : [];

/** Moving something isn't an edit to highlight, so position is left out. */
const withoutOrder = (value: object): string => {
	const { order: _order, ...rest } = value as { order?: unknown };
	return JSON.stringify(rest);
};

/** A section's own settings: its items and position are compared separately. */
const sectionSettings = (block: ContentBlock): string => {
	const {
		order: _order,
		items: _items,
		...rest
	} = block as ContentBlock & { order?: unknown; items?: unknown };
	return JSON.stringify(rest);
};

/**
 * Diffs the catalogue a review started from against the one on screen. Ids
 * carry identity, so an item moved to another section isn't new, and legacy
 * blocks are normalised on both sides so the AI's own normalisation doesn't
 * read as an edit.
 */
export function diffAiReview(
	before: Catalogue,
	after: Catalogue,
): AiReviewDiff {
	const beforeContent = normalizeContent(before.content);
	const afterContent = normalizeContent(after.content);

	const sectionsBefore = new Map(
		beforeContent.map((block) => [block.id, block]),
	);
	const itemsBefore = new Map<string, Item>();
	for (const block of beforeContent) {
		for (const item of itemsOf(block)) {
			if (item.id) itemsBefore.set(item.id, item);
		}
	}

	const sectionIds: string[] = [];
	const itemIds: string[] = [];
	for (const block of afterContent) {
		const was = sectionsBefore.get(block.id);
		if (!was || sectionSettings(was) !== sectionSettings(block)) {
			sectionIds.push(block.id);
		}
		for (const item of itemsOf(block)) {
			if (!item.id) continue;
			const previous = itemsBefore.get(item.id);
			if (!previous || withoutOrder(previous) !== withoutOrder(item)) {
				itemIds.push(item.id);
			}
		}
	}
	return { sectionIds, itemIds };
}
