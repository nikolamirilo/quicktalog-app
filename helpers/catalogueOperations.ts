import type {
	Catalogue,
	CategoryBlock,
	ContainerBlock,
	ContentBlock,
	Item,
} from "@quicktalog/common";
import type {
	AiItemInput,
	AiSectionAccess,
	CatalogueOperation,
} from "@/types/ai";

export interface OperationLimits {
	/** `sections_per_catalogue` from the current plan. */
	sections?: number | "unlimited";
	/** `items_per_catalogue` from the current plan. */
	items?: number | "unlimited";
	/** `features.sections` from the current plan — which block types are unlocked. */
	sectionTypes?: AiSectionAccess;
}

export interface OperationOutcome {
	catalogue: Catalogue;
	/** Human-readable summary of every edit that landed. */
	applied: string[];
	/** Edits that were dropped, with the reason. */
	skipped: string[];
	/** True when at least one edit was dropped because of a plan limit. */
	limitReached: boolean;
}

type ItemBlock = CategoryBlock | ContainerBlock;

const isItemBlock = (block: ContentBlock): block is ItemBlock =>
	block.type === "category" || block.type === "container";

/** Same per-type gating `AddContentModal` applies to the manual "add section" flow. */
const isSectionTypeLocked = (
	type: string,
	access: AiSectionAccess | undefined,
): boolean => {
	if (!access) return false;
	if (type === "divider") return access.divider === false;
	if (type === "embedding") return access.embedding === false;
	if (type === "custom_code") return access.customCode === false;
	return false;
};

const SECTION_TYPE_LABELS: Record<string, string> = {
	divider: "Divider",
	embedding: "Embed",
	custom_code: "Custom code",
};

const reorder = <T extends { order: number }>(arr: T[]): T[] =>
	arr.map((entry, index) => ({ ...entry, order: index }));

const label = (block: ContentBlock): string =>
	block.name ? `"${block.name}"` : `${block.type} section`;

const countItems = (content: ContentBlock[]): number =>
	content.reduce(
		(total, block) =>
			total + (isItemBlock(block) ? (block.items?.length ?? 0) : 0),
		0,
	);

/** Text blocks are free — they don't count against `sections_per_catalogue`. */
const countSections = (content: ContentBlock[]): number =>
	content.filter((block) => block.type !== "text").length;

const remaining = (
	limit: number | "unlimited" | undefined,
	used: number,
): number =>
	typeof limit === "number"
		? Math.max(0, limit - used)
		: Number.POSITIVE_INFINITY;

const toItem = (input: AiItemInput, order: number): Item => ({
	id: crypto.randomUUID(),
	order,
	name: input.name,
	description: input.description ?? "",
	image: input.image ?? "",
	price: input.price ?? 0,
	isFree: input.isFree ?? false,
	...(input.denominator ? { denominator: input.denominator } : {}),
});

const buildSection = (
	op: Extract<CatalogueOperation, { op: "add_section" }>,
	order: number,
	items: Item[],
): ContentBlock => {
	const base = { id: crypto.randomUUID(), order };
	switch (op.sectionType) {
		case "category":
			return {
				...base,
				type: "category",
				name: op.name ?? "New section",
				layout: op.layout ?? "variant_1",
				items,
				isExpanded: true,
			};
		case "container":
			return {
				...base,
				type: "container",
				name: op.name ?? "New section",
				layout: op.layout ?? "variant_1",
				items,
			};
		case "text":
			return {
				...base,
				type: "text",
				name: op.name || undefined,
				content: op.content ?? "<p>New text block</p>",
			};
		case "embedding":
			return {
				...base,
				type: "embedding",
				name: op.name || undefined,
				code: op.code ?? "",
			};
		case "custom_code":
			return {
				...base,
				type: "custom_code",
				name: op.name || undefined,
				code: op.code ?? "",
			};
		default:
			return {
				...base,
				type: "divider",
				name: op.name || undefined,
				spacing: 2,
				border: {
					isEnabled: true,
					style: "solid",
					thickness: 1,
					color: "#000000",
					opacity: 100,
				},
			};
	}
};

/**
 * Applies a batch of AI-produced edits to a catalogue and returns a new one.
 *
 * Pure: no context, no network, no mutation of the input. Every operation
 * addresses its target by id, so a batch stays correct no matter how earlier
 * operations shifted the arrays. Anything that can't be applied (unknown id,
 * plan limit) is skipped with a reason instead of throwing.
 */
export function applyCatalogueOperations(
	catalogue: Catalogue,
	operations: CatalogueOperation[],
	limits: OperationLimits = {},
): OperationOutcome {
	let next: Catalogue = { ...catalogue, content: [...catalogue.content] };
	const applied: string[] = [];
	const skipped: string[] = [];
	let limitReached = false;

	const sectionIndex = (id: string) =>
		next.content.findIndex((block) => block.id === id);

	const itemBlockAt = (index: number): ItemBlock | null => {
		const block = next.content[index];
		return block && isItemBlock(block) ? block : null;
	};

	const writeBlock = (index: number, block: ContentBlock) => {
		const content = [...next.content];
		content[index] = block;
		next = { ...next, content };
	};

	const itemBudget = () => remaining(limits.items, countItems(next.content));

	for (const operation of operations) {
		switch (operation.op) {
			case "add_section": {
				if (isSectionTypeLocked(operation.sectionType, limits.sectionTypes)) {
					limitReached = true;
					skipped.push(
						`${SECTION_TYPE_LABELS[operation.sectionType]} sections are not part of your plan.`,
					);
					break;
				}
				if (
					operation.sectionType !== "text" &&
					remaining(limits.sections, countSections(next.content)) < 1
				) {
					limitReached = true;
					skipped.push("Section limit reached — new section not added.");
					break;
				}

				const requested = operation.items ?? [];
				const budget = itemBudget();
				const accepted = requested.slice(0, Math.min(requested.length, budget));
				if (accepted.length < requested.length) limitReached = true;

				const items = accepted.map((input, index) => toItem(input, index));
				const content = [...next.content];
				const position =
					typeof operation.position === "number" &&
					operation.position >= 0 &&
					operation.position <= content.length
						? operation.position
						: content.length;
				content.splice(position, 0, buildSection(operation, position, items));
				next = { ...next, content: reorder(content) as ContentBlock[] };

				applied.push(
					items.length > 0
						? `Added section "${operation.name ?? "New section"}" with ${items.length} item${items.length === 1 ? "" : "s"}`
						: `Added ${operation.sectionType} section${operation.name ? ` "${operation.name}"` : ""}`,
				);
				break;
			}

			case "update_section": {
				const index = sectionIndex(operation.sectionId);
				const block = next.content[index];
				if (!block) {
					skipped.push("Could not find the section to update.");
					break;
				}

				const patch: Record<string, unknown> = {};
				if (operation.name !== undefined) patch.name = operation.name;
				if (isItemBlock(block)) {
					if (operation.layout !== undefined) patch.layout = operation.layout;
					if (block.type === "category" && operation.isExpanded !== undefined) {
						patch.isExpanded = operation.isExpanded;
					}
				}
				if (block.type === "text" && operation.content !== undefined) {
					patch.content = operation.content;
				}
				if (
					(block.type === "embedding" || block.type === "custom_code") &&
					operation.code !== undefined
				) {
					patch.code = operation.code;
				}
				if (Object.keys(patch).length === 0) {
					skipped.push(`Nothing to change on ${label(block)}.`);
					break;
				}

				writeBlock(index, { ...block, ...patch } as ContentBlock);
				applied.push(
					operation.name && operation.name !== block.name
						? `Renamed ${label(block)} to "${operation.name}"`
						: `Updated ${label(block)}`,
				);
				break;
			}

			case "delete_section": {
				const index = sectionIndex(operation.sectionId);
				const block = next.content[index];
				if (!block) {
					skipped.push("Could not find the section to delete.");
					break;
				}
				const content = [...next.content];
				content.splice(index, 1);
				next = { ...next, content: reorder(content) as ContentBlock[] };
				applied.push(`Deleted ${label(block)}`);
				break;
			}

			case "move_section": {
				const index = sectionIndex(operation.sectionId);
				const block = next.content[index];
				const target = operation.direction === "up" ? index - 1 : index + 1;
				if (!block || target < 0 || target >= next.content.length) {
					skipped.push("Could not move that section.");
					break;
				}
				const content = [...next.content];
				[content[index], content[target]] = [content[target], content[index]];
				next = { ...next, content: reorder(content) as ContentBlock[] };
				applied.push(`Moved ${label(block)} ${operation.direction}`);
				break;
			}

			case "add_items": {
				const index = sectionIndex(operation.sectionId);
				const block = itemBlockAt(index);
				if (!block) {
					skipped.push("Could not find the section to add items to.");
					break;
				}

				const budget = itemBudget();
				const accepted = operation.items.slice(
					0,
					Math.min(operation.items.length, budget),
				);
				if (accepted.length < operation.items.length) limitReached = true;
				if (accepted.length === 0) {
					skipped.push(
						`Item limit reached — nothing added to ${label(block)}.`,
					);
					break;
				}

				const existing = block.items ?? [];
				const items = [
					...existing,
					...accepted.map((input, offset) =>
						toItem(input, existing.length + offset),
					),
				];
				writeBlock(index, { ...block, items } as ContentBlock);
				applied.push(
					`Added ${accepted.length} item${accepted.length === 1 ? "" : "s"} to ${label(block)}`,
				);
				break;
			}

			case "update_item": {
				const index = sectionIndex(operation.sectionId);
				const block = itemBlockAt(index);
				const itemIndex =
					block?.items?.findIndex((item) => item.id === operation.itemId) ?? -1;
				if (!block || itemIndex < 0) {
					skipped.push("Could not find the item to update.");
					break;
				}

				const current = block.items[itemIndex];
				const patch: Partial<Item> = {};
				if (operation.name !== undefined) patch.name = operation.name;
				if (operation.description !== undefined)
					patch.description = operation.description;
				if (operation.price !== undefined) patch.price = operation.price;
				if (operation.isFree !== undefined) patch.isFree = operation.isFree;
				if (operation.denominator !== undefined)
					patch.denominator = operation.denominator;
				if (operation.image !== undefined) patch.image = operation.image;
				if (Object.keys(patch).length === 0) {
					skipped.push(`Nothing to change on "${current.name}".`);
					break;
				}

				const items = [...block.items];
				items[itemIndex] = { ...current, ...patch };
				writeBlock(index, { ...block, items } as ContentBlock);
				applied.push(
					Object.keys(patch).length === 1 && patch.image
						? `Added a photo to "${current.name}"`
						: `Updated "${current.name}" in ${label(block)}`,
				);
				break;
			}

			case "delete_item": {
				const index = sectionIndex(operation.sectionId);
				const block = itemBlockAt(index);
				const itemIndex =
					block?.items?.findIndex((item) => item.id === operation.itemId) ?? -1;
				if (!block || itemIndex < 0) {
					skipped.push("Could not find the item to delete.");
					break;
				}
				const removed = block.items[itemIndex];
				const items = [...block.items];
				items.splice(itemIndex, 1);
				writeBlock(index, { ...block, items: reorder(items) } as ContentBlock);
				applied.push(`Deleted "${removed.name}" from ${label(block)}`);
				break;
			}

			case "move_item": {
				const fromIndex = sectionIndex(operation.sectionId);
				const fromBlock = itemBlockAt(fromIndex);
				const itemIndex =
					fromBlock?.items?.findIndex((item) => item.id === operation.itemId) ??
					-1;
				if (!fromBlock || itemIndex < 0) {
					skipped.push("Could not find the item to move.");
					break;
				}
				const moved = fromBlock.items[itemIndex];

				if (operation.toSectionId) {
					const toIndex = sectionIndex(operation.toSectionId);
					const toBlock = itemBlockAt(toIndex);
					if (!toBlock || toIndex === fromIndex) {
						skipped.push(`Could not move "${moved.name}" to that section.`);
						break;
					}
					const fromItems = [...fromBlock.items];
					fromItems.splice(itemIndex, 1);
					const toItems = [...(toBlock.items ?? []), moved];
					writeBlock(fromIndex, {
						...fromBlock,
						items: reorder(fromItems),
					} as ContentBlock);
					writeBlock(toIndex, {
						...toBlock,
						items: reorder(toItems),
					} as ContentBlock);
					applied.push(`Moved "${moved.name}" to ${label(toBlock)}`);
					break;
				}

				const target =
					operation.direction === "up" ? itemIndex - 1 : itemIndex + 1;
				if (target < 0 || target >= fromBlock.items.length) {
					skipped.push(`Could not move "${moved.name}" any further.`);
					break;
				}
				const items = [...fromBlock.items];
				[items[itemIndex], items[target]] = [items[target], items[itemIndex]];
				writeBlock(fromIndex, {
					...fromBlock,
					items: reorder(items),
				} as ContentBlock);
				applied.push(`Moved "${moved.name}" ${operation.direction}`);
				break;
			}

			case "update_catalogue": {
				const { fields } = operation;
				const changed: string[] = [];
				const patch: Partial<Catalogue> = {};

				if (fields.heading !== undefined) {
					patch.heading = fields.heading;
					changed.push("heading");
				}
				if (fields.currency !== undefined) {
					patch.currency = fields.currency;
					changed.push("currency");
				}
				if (fields.language !== undefined) {
					patch.language = fields.language;
					changed.push("language");
				}
				if (fields.businessType !== undefined) {
					patch.businessType = fields.businessType;
					changed.push("business type");
				}
				if (fields.metadata) {
					patch.metadata = { ...next.metadata, ...fields.metadata };
					changed.push("SEO metadata");
				}
				if (fields.contact) {
					patch.contact = { ...next.contact, ...fields.contact };
					changed.push("contact details");
				}
				if (fields.legal) {
					patch.legal = { ...next.legal, ...fields.legal };
					changed.push("legal details");
				}

				if (changed.length === 0) {
					skipped.push("No catalogue settings to change.");
					break;
				}
				next = { ...next, ...patch };
				applied.push(`Updated ${changed.join(", ")}`);
				break;
			}

			case "update_appearance": {
				const { fields } = operation;
				const changed: string[] = [];
				const style = { ...next.appearance.style };
				const theme = { ...next.appearance.theme };

				if (fields.theme !== undefined) {
					theme.name = fields.theme;
					changed.push("theme");
				}
				if (fields.fontFamily !== undefined) {
					style.fontFamily = fields.fontFamily;
					changed.push("font");
				}
				if (fields.contentFontSize !== undefined) {
					style.contentFontSize = fields.contentFontSize;
					changed.push("font size");
				}
				if (fields.borderRadius !== undefined) {
					style.borderRadius = fields.borderRadius;
					changed.push("corner radius");
				}
				if (fields.shadow !== undefined) {
					style.shadow = fields.shadow;
					changed.push("shadow");
				}

				if (changed.length === 0) {
					skipped.push("No appearance settings to change.");
					break;
				}
				next = { ...next, appearance: { ...next.appearance, theme, style } };
				applied.push(`Updated ${changed.join(", ")}`);
				break;
			}

			default:
				break;
		}
	}

	return { catalogue: next, applied, skipped, limitReached };
}
