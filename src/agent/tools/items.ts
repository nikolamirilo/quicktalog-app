import {
	itemIndexSchema,
	itemInputSchema,
	MAX_ITEMS_PER_CALL,
	sectionIndexSchema,
} from "@/agent/core/schemas";
import {
	photoTrouble,
	resolveImage,
	resolveImages,
	resolveItems,
} from "@/agent/plugins/images";
import type { ToolContext } from "@/agent/tools/types";
import type { AgentToolResult } from "@/types/ai";
import { tool } from "ai";
import { z } from "zod";

/** The entries inside an items section. */
export const itemTools = ({ session, images, fail }: ToolContext) => ({
	addItems: tool({
		description: "Add one or more items to an existing items section.",
		inputSchema: z.object({
			section: sectionIndexSchema,
			items: z.array(itemInputSchema).min(1).max(MAX_ITEMS_PER_CALL),
		}),
		execute: async ({ section, items }): Promise<AgentToolResult> => {
			const target = session.resolveItemSection(section);
			if ("error" in target) return fail(target.error);

			const resolved = await resolveItems(images, items);
			const result = session.run({
				op: "add_items",
				sectionId: target.id,
				items: resolved.items,
			});

			return result.ok
				? { ...result, ...photoTrouble(images, resolved.misses) }
				: result;
		},
	}),

	addItemImages: tool({
		description:
			"Find and set the photos of items that already exist, several at a time. This is how an item that has no photo of its own gets one: the snapshot marks those [no photo]. Pass one entry per item, each with an imageQuery (or a pageImage from a page read this turn).",
		inputSchema: z.object({
			section: sectionIndexSchema,
			items: z
				.array(
					z.object({
						item: itemIndexSchema,
						pageImage: itemInputSchema.shape.pageImage,
						imageQuery: itemInputSchema.shape.imageQuery,
					}),
				)
				.min(1)
				.max(MAX_ITEMS_PER_CALL),
		}),
		execute: async ({ section, items }): Promise<AgentToolResult> => {
			const sectionTarget = session.resolveItemSection(section);
			if ("error" in sectionTarget) return fail(sectionTarget.error);

			const targets = items.map((entry) => ({
				entry,
				item: session.resolveItem(section, entry.item),
			}));
			// One bad index must not cost the other nineteen their photos, so it is
			// reported as a miss rather than refusing the whole batch.
			const resolvable = targets.flatMap(({ entry, item }) =>
				"error" in item ? [] : [{ entry, item }],
			);

			const resolved = await resolveImages(
				images,
				resolvable.map(({ entry }) => entry),
			);

			const misses: string[] = [];
			const addMiss = (name: string) => {
				if (name && !misses.includes(name)) misses.push(name);
			};
			const patches: { itemId: string; image: string }[] = [];
			resolvable.forEach(({ entry, item }, index) => {
				const image = resolved[index];
				if (image) patches.push({ itemId: item.itemId, image });
				else addMiss(entry.imageQuery || item.name);
			});
			for (const { entry, item } of targets) {
				if ("error" in item) addMiss(`item [${entry.item}]`);
			}

			if (patches.length === 0) {
				return fail(
					images.unavailable
						? `${images.unavailable} Nothing was changed. Do not search again on this turn: tell the user the photos could not be fetched right now and that they can ask again later.`
						: `No photo was found for any of those items (${misses.join(", ")}). Tell the user, and offer to try different searches.`,
				);
			}

			const result = session.run({
				op: "set_item_images",
				sectionId: sectionTarget.id,
				images: patches,
			});

			return result.ok
				? { ...result, ...photoTrouble(images, misses) }
				: result;
		},
	}),

	updateItem: tool({
		description:
			"Change one item: its name, price, description or its photo. Include only the fields you actually want to change. For photos on more than one item, call addItemImages instead.",
		inputSchema: z.object({
			section: sectionIndexSchema,
			item: itemIndexSchema,
			name: z.string().trim().max(120).optional(),
			description: z.string().trim().max(600).optional(),
			price: z.coerce.number().min(0).optional(),
			isFree: z.coerce.boolean().optional(),
			denominator: z.string().trim().max(30).optional(),
			pageImage: itemInputSchema.shape.pageImage,
			imageQuery: itemInputSchema.shape.imageQuery,
		}),
		execute: async ({
			section,
			item,
			pageImage,
			imageQuery,
			...fields
		}): Promise<AgentToolResult> => {
			const target = session.resolveItem(section, item);
			if ("error" in target) return fail(target.error);

			let image: string | undefined;
			const misses: string[] = [];
			if (pageImage || imageQuery) {
				const found = await resolveImage(images, { pageImage, imageQuery });
				if (found) image = found;
				else misses.push(imageQuery || fields.name || target.name);
			}

			const result = session.run({
				op: "update_item",
				sectionId: target.sectionId,
				itemId: target.itemId,
				...fields,
				...(image ? { image } : {}),
			});

			return result.ok
				? { ...result, ...photoTrouble(images, misses) }
				: result;
		},
	}),

	deleteItem: tool({
		description: "Delete one item. Only when the user clearly asks.",
		inputSchema: z.object({
			section: sectionIndexSchema,
			item: itemIndexSchema,
		}),
		execute: async ({ section, item }): Promise<AgentToolResult> => {
			const target = session.resolveItem(section, item);
			if ("error" in target) return fail(target.error);
			return session.run({
				op: "delete_item",
				sectionId: target.sectionId,
				itemId: target.itemId,
			});
		},
	}),

	moveItem: tool({
		description:
			"Move an item within its section, or into a different section.",
		inputSchema: z.object({
			section: sectionIndexSchema,
			item: itemIndexSchema,
			direction: z.enum(["up", "down"]).optional(),
			toSection: sectionIndexSchema
				.optional()
				.describe("Set this to move the item into another section instead."),
		}),
		execute: async ({
			section,
			item,
			direction,
			toSection,
		}): Promise<AgentToolResult> => {
			const target = session.resolveItem(section, item);
			if ("error" in target) return fail(target.error);

			let toSectionId: string | undefined;
			if (toSection !== undefined) {
				const destination = session.resolveItemSection(toSection);
				if ("error" in destination) return fail(destination.error);
				toSectionId = destination.id;
			}

			return session.run({
				op: "move_item",
				sectionId: target.sectionId,
				itemId: target.itemId,
				direction: direction ?? "down",
				toSectionId,
			});
		},
	}),
});
