import type { AiSectionAccess, AiSectionType } from "@/types/ai";
import { z } from "zod";

/** Schemas shared by more than one tool group; single-group schemas live in that group's own file. */

export const MAX_ITEMS_PER_CALL = 40;
export const MAX_CODE_CHARS = 40000;

export function allowedSectionTypes(access?: AiSectionAccess): AiSectionType[] {
	const types: AiSectionType[] = ["category", "container", "text"];
	if (access?.divider !== false) types.push("divider");
	if (access?.embedding !== false) types.push("embedding");
	if (access?.customCode !== false) types.push("custom_code");
	return types;
}

/** Per request, so a locked type is absent from the schema, not just forbidden. */
export function sectionTypeSchema(access?: AiSectionAccess) {
	const types = allowedSectionTypes(access);
	return z
		.enum(types as [AiSectionType, ...AiSectionType[]])
		.describe("The kind of section to create.");
}

export const layoutSchema = z
	.enum(["variant_1", "variant_2", "variant_3", "variant_4"])
	.describe("Card layout for category and container sections.");

export const sectionIndexSchema = z.coerce
	.number()
	.int()
	.min(0)
	.describe("The [index] of the section as shown in the catalogue snapshot.");

export const itemIndexSchema = z.coerce
	.number()
	.int()
	.min(0)
	.describe("The [index] of the item within its section.");

export const itemInputSchema = z.object({
	name: z.string().trim().min(1).max(120),
	description: z.string().trim().max(600).optional(),
	price: z.coerce
		.number()
		.min(0)
		.optional()
		.describe("Plain number, no currency symbol. Use 0 when there is none."),
	isFree: z.coerce.boolean().optional(),
	denominator: z
		.string()
		.trim()
		.max(30)
		.optional()
		.describe('Unit the price is per, e.g. "kg" or "hour".'),
	pageImage: z.coerce
		.number()
		.int()
		.min(0)
		.optional()
		.describe(
			"The number of this item's own picture on a page you read in this turn. Only set this when the user asked for images.",
		),
	imageQuery: z
		.string()
		.trim()
		.max(120)
		.optional()
		.describe(
			"Two or three plain English words describing the photo to find, e.g. 'espresso coffee cup'. A stock photo is looked up for you. Only set this when the user asked for images and there is no pageImage for the item.",
		),
});

export type ItemInput = z.infer<typeof itemInputSchema>;
