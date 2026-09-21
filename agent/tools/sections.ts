import { resolveItems } from "@/agent/images";
import {
	itemInputSchema,
	layoutSchema,
	MAX_CODE_CHARS,
	MAX_ITEMS_PER_CALL,
	sectionIndexSchema,
	sectionTypeSchema,
} from "@/agent/schemas";
import type { ToolContext } from "@/agent/tools/types";
import type { AgentToolResult } from "@/types/ai";
import { tool } from "ai";
import { z } from "zod";

/** The blocks a catalogue is made of: reading, adding, editing, ordering. */
export const sectionTools = ({ session, images, fail }: ToolContext) => ({
	readSection: tool({
		description:
			"Read one section in full, including every item. Use this when the snapshot truncated a long section and you need to see the rest before editing it.",
		inputSchema: z.object({ section: sectionIndexSchema }),
		execute: async ({ section }) => {
			const block = session.sectionAt(section);
			if (!block) return session.resolveSection(section);
			return {
				index: section,
				type: block.type,
				name: block.name ?? null,
				...("items" in block
					? {
							items: (block.items ?? []).map((item, index) => ({
								index,
								name: item.name,
								description: item.description ?? "",
								price: item.price ?? 0,
								isFree: item.isFree ?? false,
								hasImage: Boolean(item.image),
							})),
						}
					: {}),
				...("content" in block ? { content: block.content } : {}),
				...("code" in block ? { code: block.code } : {}),
			};
		},
	}),

	addSection: tool({
		description:
			"Add a new section to the catalogue. Use this whenever the user asks for something new. Never overwrite an existing section to make room for it.",
		inputSchema: z.object({
			sectionType: sectionTypeSchema(session.access),
			name: z
				.string()
				.trim()
				.max(120)
				.optional()
				.describe(
					"Short descriptive name. Always set one: on text, divider, embedding and custom_code sections it is the accessible name and how the section is identified in the builder.",
				),
			layout: layoutSchema.optional(),
			content: z
				.string()
				.max(4000)
				.optional()
				.describe("Body of a text section. Simple HTML only."),
			code: z
				.string()
				.max(MAX_CODE_CHARS)
				.optional()
				.describe("Markup for an embedding or custom_code section."),
			items: z.array(itemInputSchema).max(MAX_ITEMS_PER_CALL).optional(),
			position: sectionIndexSchema
				.optional()
				.describe("Where to insert it. Omit to append at the end."),
		}),
		execute: async ({ items, ...input }): Promise<AgentToolResult> => {
			const resolved = items
				? await resolveItems(images, items)
				: { items: [], misses: [] };

			const id = crypto.randomUUID();
			const result = session.run({
				op: "add_section",
				id,
				sectionType: input.sectionType,
				name: input.name,
				layout: input.layout,
				content: input.content,
				code: input.code,
				items: resolved.items,
				position: input.position,
			});
			if (!result.ok) return result;

			return {
				...result,
				section: session.sectionIndex(id),
				...(resolved.misses.length > 0 ? { imageMisses: resolved.misses } : {}),
			};
		},
	}),

	updateSection: tool({
		description:
			"Change an existing section. Only reach for this when the user clearly points at a section that already exists.",
		inputSchema: z.object({
			section: sectionIndexSchema,
			name: z.string().trim().max(120).optional(),
			layout: layoutSchema.optional(),
			content: z.string().max(4000).optional(),
			code: z.string().max(MAX_CODE_CHARS).optional(),
			isExpanded: z.coerce.boolean().optional(),
		}),
		execute: async ({ section, ...fields }): Promise<AgentToolResult> => {
			const target = session.resolveSection(section);
			if ("error" in target) return fail(target.error);
			return session.run({
				op: "update_section",
				sectionId: target.id,
				...fields,
			});
		},
	}),

	deleteSection: tool({
		description:
			"Delete a section and everything in it. Only when the user clearly asks.",
		inputSchema: z.object({ section: sectionIndexSchema }),
		execute: async ({ section }): Promise<AgentToolResult> => {
			const target = session.resolveSection(section);
			if ("error" in target) return fail(target.error);
			return session.run({ op: "delete_section", sectionId: target.id });
		},
	}),

	moveSection: tool({
		description: "Move a section one place up or down.",
		inputSchema: z.object({
			section: sectionIndexSchema,
			direction: z.enum(["up", "down"]),
		}),
		execute: async ({ section, direction }): Promise<AgentToolResult> => {
			const target = session.resolveSection(section);
			if ("error" in target) return fail(target.error);
			return session.run({
				op: "move_section",
				sectionId: target.id,
				direction,
			});
		},
	}),
});
