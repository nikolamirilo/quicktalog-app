import { fetchImageFromUnsplash } from "@quicktalog/common";
import type { Catalogue, ContentBlock } from "@quicktalog/common";
import type {
	AiItemInput,
	AiSectionAccess,
	AiSectionType,
	CatalogueOperation,
} from "@/types/ai";
import { z } from "zod";

/** Keeps one snapshot bounded so a huge catalogue can't blow up the prompt. */
const MAX_SNAPSHOT_SECTIONS = 40;
const MAX_SNAPSHOT_ITEMS = 40;
const MAX_OPERATIONS = 40;
const MAX_CODE_CHARS = 40000;

const layoutSchema = z.enum([
	"variant_1",
	"variant_2",
	"variant_3",
	"variant_4",
]);
const sectionIndexSchema = z.coerce.number().int().min(0);

const itemInputSchema = z.object({
	name: z.string().trim().min(1).max(120),
	description: z.string().trim().max(600).optional(),
	price: z.coerce.number().min(0).optional(),
	isFree: z.coerce.boolean().optional(),
	denominator: z.string().trim().max(30).optional(),
	imageQuery: z.string().trim().max(120).optional(),
});

/**
 * What the model is allowed to emit. Sections and items are addressed by their
 * position in the snapshot; `toClientOperations` swaps those for stable ids.
 */
const rawOperationSchema = z.discriminatedUnion("op", [
	z.object({
		op: z.literal("add_section"),
		sectionType: z.enum([
			"category",
			"container",
			"text",
			"divider",
			"embedding",
			"custom_code",
		]),
		name: z.string().trim().max(120).optional(),
		layout: layoutSchema.optional(),
		content: z.string().max(4000).optional(),
		code: z.string().max(MAX_CODE_CHARS).optional(),
		items: z.array(itemInputSchema).max(40).optional(),
		position: sectionIndexSchema.optional(),
	}),
	z.object({
		op: z.literal("update_section"),
		section: sectionIndexSchema,
		name: z.string().trim().max(120).optional(),
		layout: layoutSchema.optional(),
		content: z.string().max(4000).optional(),
		code: z.string().max(MAX_CODE_CHARS).optional(),
		isExpanded: z.coerce.boolean().optional(),
	}),
	z.object({ op: z.literal("delete_section"), section: sectionIndexSchema }),
	z.object({
		op: z.literal("move_section"),
		section: sectionIndexSchema,
		direction: z.enum(["up", "down"]),
	}),
	z.object({
		op: z.literal("add_items"),
		section: sectionIndexSchema,
		items: z.array(itemInputSchema).min(1).max(40),
	}),
	z.object({
		op: z.literal("update_item"),
		section: sectionIndexSchema,
		item: sectionIndexSchema,
		name: z.string().trim().max(120).optional(),
		description: z.string().trim().max(600).optional(),
		price: z.coerce.number().min(0).optional(),
		isFree: z.coerce.boolean().optional(),
		denominator: z.string().trim().max(30).optional(),
		imageQuery: z.string().trim().max(120).optional(),
	}),
	z.object({
		op: z.literal("delete_item"),
		section: sectionIndexSchema,
		item: sectionIndexSchema,
	}),
	z.object({
		op: z.literal("move_item"),
		section: sectionIndexSchema,
		item: sectionIndexSchema,
		direction: z.enum(["up", "down"]).optional(),
		toSection: sectionIndexSchema.optional(),
	}),
	z.object({
		op: z.literal("update_catalogue"),
		fields: z.object({
			heading: z.string().max(2000).optional(),
			currency: z.string().trim().max(10).optional(),
			language: z.string().trim().max(10).optional(),
			businessType: z.string().trim().max(60).optional(),
			metadata: z
				.object({
					title: z.string().trim().max(120).optional(),
					description: z.string().trim().max(400).optional(),
				})
				.optional(),
			contact: z
				.object({
					phone: z.string().trim().max(40).optional(),
					email: z.string().trim().max(120).optional(),
					website: z.string().trim().max(200).optional(),
				})
				.optional(),
			legal: z
				.object({
					legalName: z.string().trim().max(120).optional(),
					address: z.string().trim().max(200).optional(),
				})
				.optional(),
		}),
	}),
	z.object({
		op: z.literal("update_appearance"),
		fields: z.object({
			theme: z.string().trim().max(60).optional(),
			fontFamily: z.string().trim().max(40).optional(),
			contentFontSize: z.enum(["small", "medium", "large"]).optional(),
			borderRadius: z.coerce.number().min(0).max(64).optional(),
			shadow: z.enum(["none", "low", "medium", "high"]).optional(),
		}),
	}),
]);

export const catalogueEditResponseSchema = z.object({
	reply: z.string().trim().max(1200).optional().default(""),
	operations: z
		.array(rawOperationSchema)
		.max(MAX_OPERATIONS)
		.optional()
		.default([]),
});

export type RawCatalogueOperation = z.infer<typeof rawOperationSchema>;

type RawItemInput = z.infer<typeof itemInputSchema>;

/**
 * The project compiles with `strict: false`, so Zod infers every field as
 * optional. Rebuild the items explicitly and drop any the model left unnamed.
 */
const toItemInputs = (items: RawItemInput[] | undefined): AiItemInput[] =>
	(items ?? [])
		.filter((item) => Boolean(item?.name))
		.map((item) => ({
			name: item.name,
			description: item.description,
			price: item.price,
			isFree: item.isFree,
			denominator: item.denominator,
			imageQuery: item.imageQuery,
		}));

const stripHtml = (value: string): string =>
	value
		.replace(/<[^>]*>/g, " ")
		.replace(/&nbsp;/g, " ")
		.replace(/\s+/g, " ")
		.trim();

const truncate = (value: string, max: number): string =>
	value.length > max ? `${value.slice(0, max)}…` : value;

const describeItems = (block: ContentBlock): string[] => {
	if (block.type !== "category" && block.type !== "container") return [];
	const items = block.items ?? [];
	const lines = items.slice(0, MAX_SNAPSHOT_ITEMS).map((item, index) => {
		const price = item.isFree ? "free" : String(item.price ?? 0);
		const description = item.description
			? ` — ${truncate(stripHtml(item.description), 80)}`
			: "";
		const image = item.image ? " [img]" : "";
		return `    [${index}] "${item.name}" ${price}${image}${description}`;
	});
	if (items.length > MAX_SNAPSHOT_ITEMS) {
		lines.push(`    …and ${items.length - MAX_SNAPSHOT_ITEMS} more items`);
	}
	return lines;
};

/**
 * Renders the catalogue as a compact, position-indexed outline. Indices in this
 * text are the contract the model uses to point at sections and items.
 */
export function buildCatalogueSnapshot(catalogue: Catalogue): string {
	const { style, theme } = catalogue.appearance;
	const content = catalogue.content ?? [];
	const lines: string[] = [
		`SLUG: ${catalogue.name}`,
		`HEADING: ${truncate(stripHtml(catalogue.heading ?? ""), 160) || "(empty)"}`,
		`CURRENCY: ${catalogue.currency} | LANGUAGE: ${catalogue.language} | BUSINESS TYPE: ${catalogue.businessType || "(unset)"}`,
		`APPEARANCE: theme=${theme.name} font=${style.fontFamily} size=${style.contentFontSize} radius=${style.borderRadius} shadow=${style.shadow}`,
		`SECTIONS (${content.length}):`,
	];

	if (content.length === 0) {
		lines.push("  (none yet)");
	}

	content.slice(0, MAX_SNAPSHOT_SECTIONS).forEach((block, index) => {
		if (block.type === "category" || block.type === "container") {
			lines.push(
				`  [${index}] ${block.type} "${block.name}" layout=${block.layout} items=${block.items?.length ?? 0}`,
			);
			lines.push(...describeItems(block));
		} else if (block.type === "text") {
			lines.push(
				`  [${index}] text${block.name ? ` "${block.name}"` : ""} — "${truncate(stripHtml(block.content ?? ""), 160)}"`,
			);
		} else if (block.type === "custom_code" || block.type === "embedding") {
			// Blocks created before `name` existed will never have one, so fall back
			// to a markup excerpt: class names, headings and iframe sources are what
			// let the model recognise a block it already built.
			const hint =
				block.name ||
				truncate((block.code ?? "").replace(/\s+/g, " ").trim(), 140) ||
				"(empty)";
			lines.push(`  [${index}] ${block.type} — ${hint}`);
		} else {
			lines.push(
				`  [${index}] ${block.type}${block.name ? ` — ${block.name}` : ""}`,
			);
		}
	});

	if (content.length > MAX_SNAPSHOT_SECTIONS) {
		lines.push(
			`  …and ${content.length - MAX_SNAPSHOT_SECTIONS} more sections`,
		);
	}

	return lines.join("\n");
}

/**
 * Bounds how many stock-photo lookups one chat turn can trigger.
 */
const MAX_IMAGE_LOOKUPS = 24;

/**
 * `fetchImageFromUnsplash` resolves to this stock placeholder when the search
 * comes back empty. Treat that as "no photo found" and leave the item's image
 * untouched rather than dropping a grey placeholder into someone's catalogue.
 */
const UNSPLASH_MISS =
	"https://static1.squarespace.com/static/5898e29c725e25e7132d5a5a/58aa11bc9656ca13c4524c68/58aa11e99656ca13c45253e2/1487540713345/600x400-Image-Placeholder.jpg?format=original";

const collectQueries = (operations: CatalogueOperation[]): string[] => {
	const queries = new Set<string>();
	for (const operation of operations) {
		if (operation.op === "add_section" || operation.op === "add_items") {
			for (const item of operation.items ?? []) {
				if (item.imageQuery) queries.add(item.imageQuery);
			}
		} else if (operation.op === "update_item" && operation.imageQuery) {
			queries.add(operation.imageQuery);
		}
	}
	return [...queries].slice(0, MAX_IMAGE_LOOKUPS);
};

/**
 * Swaps every `imageQuery` the model produced for a real photo URL, looking the
 * queries up in parallel and reusing one result per distinct query. Operations
 * come back with `imageQuery` stripped, so the client only ever sees `image`.
 */
export async function resolveOperationImages(
	operations: CatalogueOperation[],
): Promise<CatalogueOperation[]> {
	const queries = collectQueries(operations);
	if (queries.length === 0) return operations;

	const found = new Map<string, string>();
	await Promise.all(
		queries.map(async (query) => {
			const url = await fetchImageFromUnsplash(query);
			if (url && url !== UNSPLASH_MISS) found.set(query, url);
		}),
	);

	const resolveItem = (item: AiItemInput): AiItemInput => {
		const { imageQuery, ...rest } = item;
		const image = imageQuery ? found.get(imageQuery) : undefined;
		return image ? { ...rest, image } : rest;
	};

	return operations.map((operation) => {
		if (operation.op === "add_section") {
			return operation.items
				? { ...operation, items: operation.items.map(resolveItem) }
				: operation;
		}
		if (operation.op === "add_items") {
			return { ...operation, items: operation.items.map(resolveItem) };
		}
		if (operation.op === "update_item") {
			const { imageQuery, ...rest } = operation;
			const image = imageQuery ? found.get(imageQuery) : undefined;
			return image ? { ...rest, image } : rest;
		}
		return operation;
	});
}

/** Section types this plan can create, in the order the prompt should list them. */
export function allowedSectionTypes(access?: AiSectionAccess): AiSectionType[] {
	const types: AiSectionType[] = ["category", "container", "text"];
	if (access?.divider !== false) types.push("divider");
	if (access?.embedding !== false) types.push("embedding");
	if (access?.customCode !== false) types.push("custom_code");
	return types;
}

export function buildEditorSystemPrompt(
	catalogue: Catalogue,
	access?: AiSectionAccess,
): string {
	const sectionTypes = allowedSectionTypes(access);
	const locked = (
		["divider", "embedding", "custom_code"] as AiSectionType[]
	).filter((type) => !sectionTypes.includes(type));

	return `You are the AI editor built into Quicktalog, a digital catalogue builder. The user asks for changes in plain language and you turn them into edit operations on their catalogue.

Reply with ONLY a JSON object of this shape:
{"reply": string, "operations": [ ...operations ]}

"reply" is one or two short sentences to the user in their language, confirming what you changed or asking for the detail you are missing. Never mention JSON, operations or indices in "reply".
"operations" is the ordered list of edits. Use [] when the user only asks a question or when you need more information.

Sections and items are addressed by the [index] shown in the CATALOGUE snapshot below. Indices always refer to that snapshot, never to a state part-way through your own operations.

Available operations:
{"op":"add_section","sectionType":${sectionTypes.map((type) => `"${type}"`).join("|")},"name":string,"layout":"variant_1"|"variant_2"|"variant_3"|"variant_4","content":string,"code":string,"items":[{"name":string,"description":string,"price":number,"isFree":boolean,"denominator":string,"imageQuery":string}],"position":number}
{"op":"update_section","section":number,"name":string,"layout":string,"content":string,"code":string,"isExpanded":boolean}
{"op":"delete_section","section":number}
{"op":"move_section","section":number,"direction":"up"|"down"}
{"op":"add_items","section":number,"items":[{...same item shape...}]}
{"op":"update_item","section":number,"item":number,"name":string,"description":string,"price":number,"isFree":boolean,"denominator":string,"imageQuery":string}
{"op":"delete_item","section":number,"item":number}
{"op":"move_item","section":number,"item":number,"direction":"up"|"down","toSection":number}
{"op":"update_catalogue","fields":{"heading":string,"currency":string,"language":string,"businessType":string,"metadata":{"title":string,"description":string},"contact":{"phone":string,"email":string,"website":string},"legal":{"legalName":string,"address":string}}}
{"op":"update_appearance","fields":{"theme":string,"fontFamily":string,"contentFontSize":"small"|"medium"|"large","borderRadius":number,"shadow":"none"|"low"|"medium"|"high"}}

Rules:
- Include only the fields you actually want to change; omit the rest.
- The CATALOGUE snapshot below is the current state of the catalogue and already contains everything you did on earlier turns. Never repeat an operation from an earlier turn, and before adding a section check whether the snapshot already shows one like it — if it does, say so in "reply" instead of adding a duplicate.
- Asking for something new means add_section. Reach for update_section only when the user clearly points at a section that already exists — by its name, or with words like change, edit, update, fix, restyle or replace. Never overwrite an existing section to make room for a new one, and never repurpose a section just because it happens to be the same type as the thing you are building.
- Section types: "category" (collapsible list of items), "container" (always-open list of items), "text" (a block of prose, set "content"), "divider" (a horizontal rule), "embedding" (third-party embed such as a Google Map, YouTube video or booking widget, set "code"), "custom_code" (raw HTML/CSS/JS, set "code"). Use "category" for items unless the user asks otherwise.
- "embedding" is for third-party embeds. Its "code" must be an embed snippet or URL the user gave you in this conversation — never invent a src, an API key or an account id. If they ask you to embed a service without supplying the snippet, return no operations and ask for it in "reply".
- "custom_code" is the opposite: it is for original code you write yourself, such as an interactive widget, game, calculator or custom layout. Write it without being asked for a URL. Its "code" must be one self-contained HTML fragment with inline <style> and <script>, using no external scripts, CDNs, fonts, images or network calls. Prefix your class names and ids so they cannot collide with the rest of the page, and keep the whole fragment compact. You may use item names, prices and descriptions from the CATALOGUE snapshot.
- Never paste catalogue text straight into a JavaScript string literal: one apostrophe in a name ("Chef's Special") is a syntax error that stops the whole widget silently. Put the data in a <script type="application/json" id="..."> tag and read it back with JSON.parse(document.getElementById("...").textContent).
- Every section type accepts a "name". On text, divider, embedding and custom_code sections it is never drawn on the page: it is the section's accessible name for screen readers and how the section is identified in the builder. Always set a short, descriptive one when you create such a section.
- Keep widgets legible: when one shows a list, use at most 12 items chosen as a representative spread, not the whole catalogue. Say in "reply" how many you used.
- Never look elements up on the whole document with getElementById or a bare document.querySelector, and do not give elements id attributes. The same widget can appear more than once on a page, ids then collide and every copy after the first silently stays empty. Start your script with "var root = document.currentScript.parentNode;" and find everything with root.querySelector(...) using class names.
- Run your setup code immediately, at the top level of the <script>. Never wrap it in a DOMContentLoaded, load or readystatechange listener and never call it from window.onload: the script is injected after the page has finished loading, so those events have already fired and your code would never run. The elements you created earlier in the same fragment are already in the document by the time the script executes.${
		locked.length > 0
			? `\n- This user's plan cannot use these section types: ${locked.join(", ")}. Never create them; say so in "reply" and suggest an alternative.`
			: ""
	}
- Prices are plain numbers in ${catalogue.currency} with no symbols. Use 0 when there is no price, and isFree only when something is explicitly free.
- "heading" and text-section "content" are HTML fragments; keep them simple (<h1>, <p>, <strong>, <em>, <br>).
- Available themes: theme-monochrome, theme-elegant, theme-organic, theme-modern, theme-luxury, theme-creative, theme-coffee.
- Write all user-visible text in ${catalogue.language || "the language of the catalogue"} and match the tone of the existing content.
- Never invent items, prices or contact details the user did not ask for. When a request is ambiguous or destructive and unclear, return no operations and ask in "reply".
- Deleting is allowed when the user clearly asks for it.
- Photos: never write an image URL. Set "imageQuery" to two or three plain English words describing the photo you want ("espresso coffee cup", "margherita pizza") and a stock photo is looked up for you. Write the query in English even when the catalogue is in another language.
- Only set "imageQuery" when the user asks for images. The snapshot marks items that already have one with [img]; when the user asks to fill in missing photos, skip those.

CATALOGUE:
${buildCatalogueSnapshot(catalogue)}`;
}

/**
 * Converts snapshot-relative operations into id-addressed ones. Operations that
 * point at a section or item that does not exist are dropped here rather than
 * silently mangling a neighbouring row.
 */
export function toClientOperations(
	catalogue: Catalogue,
	raw: RawCatalogueOperation[],
): CatalogueOperation[] {
	const content = catalogue.content ?? [];
	const sectionId = (index: number): string | null =>
		content[index]?.id ?? null;
	/** Only category/container sections can hold items. */
	const itemSectionId = (index: number): string | null => {
		const block = content[index];
		if (!block || (block.type !== "category" && block.type !== "container")) {
			return null;
		}
		return block.id;
	};

	const itemId = (sectionIdx: number, itemIdx: number): string | null => {
		const block = content[sectionIdx];
		if (!block || (block.type !== "category" && block.type !== "container")) {
			return null;
		}
		return block.items?.[itemIdx]?.id ?? null;
	};

	const resolved: CatalogueOperation[] = [];

	for (const operation of raw) {
		switch (operation.op) {
			case "add_section": {
				resolved.push({
					op: "add_section",
					sectionType: operation.sectionType,
					name: operation.name,
					layout: operation.layout,
					content: operation.content,
					code: operation.code,
					items: toItemInputs(operation.items),
					position: operation.position,
				});
				break;
			}
			case "update_section": {
				const id = sectionId(operation.section);
				if (!id) break;
				resolved.push({
					op: "update_section",
					sectionId: id,
					name: operation.name,
					layout: operation.layout,
					content: operation.content,
					code: operation.code,
					isExpanded: operation.isExpanded,
				});
				break;
			}
			case "delete_section": {
				const id = sectionId(operation.section);
				if (id) resolved.push({ op: "delete_section", sectionId: id });
				break;
			}
			case "move_section": {
				const id = sectionId(operation.section);
				if (id) {
					resolved.push({
						op: "move_section",
						sectionId: id,
						direction: operation.direction,
					});
				}
				break;
			}
			case "add_items": {
				const id = itemSectionId(operation.section);
				const items = toItemInputs(operation.items);
				if (id && items.length > 0) {
					resolved.push({ op: "add_items", sectionId: id, items });
				}
				break;
			}
			case "update_item": {
				const id = itemSectionId(operation.section);
				const item = itemId(operation.section, operation.item);
				if (!id || !item) break;
				resolved.push({
					op: "update_item",
					sectionId: id,
					itemId: item,
					name: operation.name,
					description: operation.description,
					price: operation.price,
					isFree: operation.isFree,
					denominator: operation.denominator,
					imageQuery: operation.imageQuery,
				});
				break;
			}
			case "delete_item": {
				const id = itemSectionId(operation.section);
				const item = itemId(operation.section, operation.item);
				if (id && item) {
					resolved.push({ op: "delete_item", sectionId: id, itemId: item });
				}
				break;
			}
			case "move_item": {
				const id = itemSectionId(operation.section);
				const item = itemId(operation.section, operation.item);
				if (!id || !item) break;
				const toSectionId =
					operation.toSection !== undefined
						? (itemSectionId(operation.toSection) ?? undefined)
						: undefined;
				if (operation.toSection !== undefined && !toSectionId) break;
				resolved.push({
					op: "move_item",
					sectionId: id,
					itemId: item,
					direction: operation.direction ?? "down",
					toSectionId,
				});
				break;
			}
			case "update_catalogue": {
				resolved.push({ op: "update_catalogue", fields: operation.fields });
				break;
			}
			case "update_appearance": {
				resolved.push({ op: "update_appearance", fields: operation.fields });
				break;
			}
			default:
				break;
		}
	}

	return resolved;
}
