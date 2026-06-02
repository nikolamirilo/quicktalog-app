import type { CategoryBlock, ContainerBlock, Item } from "@quicktalog/common";

export const INITIAL_ITEM_COUNT = 20;
export const LOAD_MORE_STEP = 20;

export interface DisplayItem {
	item: Item;
	originalIndex: number;
}

export function normalizeText(value: string | null | undefined): string {
	if (!value) return "";
	const withoutTags = String(value).replace(/<[^>]*>/g, " ");
	return withoutTags
		.normalize("NFD")
		.replace(/[̀-ͯ]/g, "")
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
