import type {
	AnyItemsBlock,
	ContentBlock,
	ItemsBlock,
} from "@quicktalog/common";

/**
 * `category` and `container` were merged into `items`. Stored rows are migrated,
 * but a Redis-cached draft or an unmigrated row can still carry a legacy key, so
 * everything reads through here rather than matching on the key directly.
 */
export function isItemsBlock(block: ContentBlock): block is AnyItemsBlock {
	return (
		block?.type === "items" ||
		block?.type === "category" ||
		block?.type === "container"
	);
}

/**
 * A legacy `container` stored a `name` that was never rendered - it labelled the
 * block in the builder only. Mapping it to `showHeading: false` is what keeps an
 * already-published page identical after the merge.
 */
export function normalizeBlock(block: ContentBlock): ContentBlock {
	if (block?.type === "category") {
		return {
			id: block.id,
			order: block.order,
			type: "items",
			name: block.name ?? "",
			showHeading: true,
			isExpanded: block.isExpanded ?? true,
			layout: block.layout,
			items: block.items ?? [],
		};
	}
	if (block?.type === "container") {
		return {
			id: block.id,
			order: block.order,
			type: "items",
			name: block.name ?? "",
			showHeading: false,
			isExpanded: true,
			layout: block.layout,
			items: block.items ?? [],
		};
	}
	return block;
}

export function normalizeContent(
	content: ContentBlock[] | undefined | null,
): ContentBlock[] {
	if (!Array.isArray(content)) return [];
	return content.map(normalizeBlock);
}

/** Narrows and normalizes in one step, for the call sites that need the fields. */
export function asItemsBlock(block: ContentBlock): ItemsBlock | null {
	if (!isItemsBlock(block)) return null;
	return normalizeBlock(block) as ItemsBlock;
}
