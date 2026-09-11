import type {
	CategoryBlock,
	ContainerBlock,
	ContentBlock,
	Item,
} from "@quicktalog/common";

export const INITIAL_ITEM_COUNT = 20;
export const LOAD_MORE_STEP = 20;
/** Below this many items a catalogue is short enough to scan without search. */
export const SEARCH_MIN_ITEMS = 20;

export interface DisplayItem {
	item: Item;
	originalIndex: number;
}

export function normalizeText(value: string | null | undefined): string {
	if (!value) return "";
	const withoutTags = String(value).replace(/<[^>]*>/g, " ");
	return withoutTags
		.normalize("NFD")
		.replace(/[\u0300-\u036f]/g, "")
		.toLowerCase()
		.replace(/\s+/g, " ")
		.trim();
}

export function matchesQuery(item: Item, query: string): boolean {
	const q = normalizeText(query);
	if (!q) return true;
	const haystack = `${normalizeText(item.name)} ${normalizeText(item.description)}`;
	return q.split(" ").every((term) => haystack.includes(term));
}

export function getDisplayItems(
	block: CategoryBlock | ContainerBlock,
	query: string,
): DisplayItem[] {
	const items = block?.items;
	if (!Array.isArray(items) || items.length === 0) return [];
	const result: DisplayItem[] = [];
	for (let i = 0; i < items.length; i++) {
		if (matchesQuery(items[i], query)) {
			result.push({ item: items[i], originalIndex: i });
		}
	}
	return result;
}

export function getTotalItemCount(blocks: ContentBlock[] | undefined): number {
	if (!Array.isArray(blocks)) return 0;
	return blocks.reduce((total, block) => {
		if (block.type !== "category" && block.type !== "container") return total;
		return total + (block.items?.length ?? 0);
	}, 0);
}
