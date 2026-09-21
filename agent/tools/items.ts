import { resolveImage, resolveItems } from "@/agent/images";
import {
	itemIndexSchema,
	itemInputSchema,
	MAX_ITEMS_PER_CALL,
	sectionIndexSchema,
} from "@/agent/schemas";
import type { ToolContext } from "@/agent/tools/types";
import type { AgentToolResult } from "@/types/ai";
import { tool } from "ai";
import { z } from "zod";

/** The entries inside a category or container section. */
export const itemTools = ({ session, images, fail }: ToolContext) => ({
	addItems: tool({
		description: "Add one or more items to an existing category or container.",
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

			return result.ok && resolved.misses.length > 0
				? { ...result, imageMisses: resolved.misses }
				: result;
		},
	}),

	updateItem: tool({
		description:
			"Change one item. Include only the fields you actually want to change.",
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

			return result.ok && misses.length > 0
				? { ...result, imageMisses: misses }
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
