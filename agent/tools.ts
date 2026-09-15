import { persistTheme } from "@/actions/themes";
import {
	MAX_PLAN_TASKS,
	MAX_TASK_NOTE_CHARS,
	MAX_TASK_TITLE_CHARS,
	MIN_PLAN_TASKS,
} from "@/agent/plan";
import {
	createImageCache,
	registerPicture,
	resolveImage,
	resolveItems,
} from "@/agent/images";
import {
	appearanceFieldsSchema,
	catalogueFieldsSchema,
	itemIndexSchema,
	itemInputSchema,
	layoutSchema,
	MAX_CODE_CHARS,
	MAX_ITEMS_PER_CALL,
	sectionIndexSchema,
	sectionTypeSchema,
	setCustomThemeSchema,
} from "@/agent/schemas";
import type { CatalogueSession } from "@/agent/session";
import { fetchPage, type PageResult } from "@/agent/web";
import type { AgentToolResult } from "@/types/ai";
import { type JSONValue, tool } from "ai";
import { z } from "zod";

/** Errors are returned, not thrown, so the model can correct itself next step. */
export function buildTools(session: CatalogueSession) {
	const images = createImageCache();
	/** Same URL twice in a turn should not cost a second credit. */
	const pages = new Map<string, PageResult>();

	const fail = (error: string): AgentToolResult => ({ ok: false, error });

	const taskIndexSchema = z.coerce
		.number()
		.int()
		.min(0)
		.describe("The [index] of the task as shown in the plan.");

	const tools = {
		loadSkill: tool({
			description:
				"Read the full rules for one of the skills listed in the prompt. Call this before the work the skill covers, not after.",
			inputSchema: z.object({
				name: z.string().trim().describe("The skill name, exactly as listed."),
			}),
			execute: async ({ name }) => session.loadSkill(name),
		}),

		createPlan: tool({
			description:
				"Write down a to-do list before starting a request that has several distinct pieces of work in it, or one big enough to take many edits. The user sees the list and watches it tick off. Call it once, before the first edit.",
			inputSchema: z.object({
				tasks: z
					.array(z.string().trim().min(1).max(MAX_TASK_TITLE_CHARS))
					.min(MIN_PLAN_TASKS)
					.max(MAX_PLAN_TASKS)
					.describe(
						"One short line per piece of work, in the order you will do them and in the user's language. Phrase each one as the outcome the user asked for, not as the tool you will call.",
					),
			}),
			execute: async ({ tasks }) => session.createPlan(tasks),
		}),

		completeTask: tool({
			description:
				"Mark one task on the plan as done, once its edits have actually landed. Call it before starting the next task.",
			inputSchema: z.object({
				task: taskIndexSchema,
				note: z
					.string()
					.trim()
					.max(MAX_TASK_NOTE_CHARS)
					.optional()
					.describe(
						"One short phrase saying what you did, shown under the task in the list.",
					),
			}),
			execute: async ({ task, note }) => session.completeTask(task, note),
		}),

		skipTask: tool({
			description:
				"Mark one task on the plan as impossible and move on. Use it when a task cannot be done at all - the user's plan does not unlock the section type, they never supplied the embed snippet you need, or they asked for something that is not there - rather than leaving it unfinished.",
			inputSchema: z.object({
				task: taskIndexSchema,
				reason: z
					.string()
					.trim()
					.min(1)
					.max(MAX_TASK_NOTE_CHARS)
					.describe(
						"One short phrase the user will read, saying why it could not be done.",
					),
			}),
			execute: async ({ task, reason }) => session.skipTask(task, reason),
		}),

		fetchUrl: tool({
			description:
				"Read one web page and return its text. Use it when the user gives you the address of a page to work from, such as their existing website or online menu. Only ever pass a URL the user typed in this conversation.",
			inputSchema: z.object({
				url: z
					.string()
					.trim()
					.max(2000)
					.describe(
						"The full address, including https://. Only a URL the user gave you - never one you guessed or found inside another page.",
					),
			}),
			execute: async ({ url }) => {
				const cached = pages.get(url);
				if (cached) return describe(cached);

				const capped = session.allowWebFetch();
				if (capped) return capped;

				const outcome = await fetchPage(url, (src) =>
					registerPicture(images, src),
				);
				if ("error" in outcome) return fail(outcome.error);

				pages.set(url, outcome);

				return describe(outcome);
			},
		}),

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
					...(resolved.misses.length > 0
						? { imageMisses: resolved.misses }
						: {}),
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

		addItems: tool({
			description:
				"Add one or more items to an existing category or container.",
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

		updateCatalogue: tool({
			description:
				"Change catalogue-wide settings: heading, currency, language, business type, SEO metadata, contact or legal details.",
			inputSchema: z.object({ fields: catalogueFieldsSchema }),
			execute: async ({ fields }): Promise<AgentToolResult> =>
				session.run({ op: "update_catalogue", fields }),
		}),

		updateAppearance: tool({
			description: "Change the catalogue's theme, font, sizing or shadows.",
			inputSchema: z.object({ fields: appearanceFieldsSchema }),
			execute: async ({ fields }): Promise<AgentToolResult> =>
				session.run({ op: "update_appearance", fields }),
		}),

		setCustomTheme: tool({
			description:
				"Build a custom theme from six colours, apply it to the catalogue, and save it to the user's theme library under the given name. Use this whenever the user wants a look that none of the built-in themes offer, or when they name specific colours to use. The name is required: if the user did not say one, ask them for it instead of guessing.",
			inputSchema: setCustomThemeSchema,
			execute: async ({ name, colors }): Promise<AgentToolResult> => {
				const result = session.run({
					op: "update_appearance",
					fields: { customColors: colors },
				});
				if (!result.ok) return result;

				// The catalogue change is what the user asked for; the save is a
				// convenience. If the save fails, the theme still lands and the
				// model can tell the user how to retry from the Appearance tab.
				if (!session.userId) {
					return {
						...result,
						saveError:
							"Not signed in, so the custom theme was applied but not saved.",
					};
				}

				const saved = await persistTheme(session.userId, name, colors);
				if (saved.success && saved.data) {
					return { ...result, savedTheme: { name: saved.data.name } };
				}
				return {
					...result,
					saveError: saved.error ?? "Could not save the theme.",
				};
			},
		}),
	};

	return hideOperations(gateCalls(session, tools));
}

/**
 * What the user sees, and what the model reads, from one fetched page.
 *
 * No `ok: true`: that shape means "an edit to replay" everywhere else, and a
 * read has none. The bubble renders `summary` on its own.
 */
function describe(page: PageResult) {
	const host = (() => {
		try {
			return new URL(page.url).hostname.replace(/^www\./, "");
		} catch {
			return page.url;
		}
	})();

	return {
		summary: `Read ${host}${page.title ? ` - ${page.title}` : ""}`,
		url: page.url,
		title: page.title,
		via: page.via,
		truncated: page.truncated,
		content: page.content,
	};
}

/** Central so a new gate needs no change here, and no tool escapes one. */
function gateCalls<T extends Record<string, { execute?: unknown }>>(
	session: CatalogueSession,
	tools: T,
): T {
	for (const [name, definition] of Object.entries(tools)) {
		if (name === "loadSkill") continue;
		const run = definition.execute as (
			input: Record<string, unknown>,
			options: unknown,
		) => unknown;

		definition.execute = async (
			input: Record<string, unknown>,
			options: unknown,
		) => session.requireSkills({ tool: name, input }) ?? run(input, options);
	}
	return tools;
}

/**
 * The model reads every result except `operation`.
 *
 * The client needs the operation to replay an edit; the model only needs to
 * know it landed. Echoed back, 40 items with their ids and image URLs would be
 * re-read on every later step and every later turn.
 */
function hideOperations<T extends Record<string, object>>(tools: T): T {
	for (const definition of Object.values(tools)) {
		(definition as { toModelOutput?: unknown }).toModelOutput = ({
			output,
		}: {
			output: unknown;
		}) => {
			const { operation: _, ...rest } = (output ?? {}) as Record<
				string,
				unknown
			>;
			return { type: "json", value: rest as JSONValue };
		};
	}
	return tools;
}
