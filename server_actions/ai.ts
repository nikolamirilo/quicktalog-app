"use server";
import { fetchUserData } from "@/lib/users/fetchUserData";
import type { AiActionResult, GeneratedItem } from "@/types/ai";
import { drizzleClient } from "@/utils/drizzle";
import { generateJSON, generateText } from "@/utils/deepseek";
import { currentUser } from "@clerk/nextjs/server";
import { schema } from "@quicktalog/common";
import * as Sentry from "@sentry/nextjs";
import { eq } from "drizzle-orm";
import { z } from "zod";

const catalogues = schema.catalogues;
const prompts = schema.prompts;

const generatedItemSchema = z.object({
	name: z.string().trim().min(1).max(120),
	description: z.string().trim().max(400).optional().default(""),
	price: z.coerce.number().min(0).optional().default(0),
	isFree: z.coerce.boolean().optional().default(false),
});

const generatedItemsSchema = z.object({
	items: z.array(generatedItemSchema).max(30),
});

function toGeneratedItems(
	items: z.infer<typeof generatedItemsSchema>["items"],
): GeneratedItem[] {
	return items.map((it) => ({
		name: it.name,
		description: it.description ?? "",
		price: it.price ?? 0,
		isFree: it.isFree ?? false,
	}));
}

type AuthResult =
	| { ok: true; userId: string }
	| {
			ok: false;
			error: string;
			code: NonNullable<AiActionResult<unknown>["code"]>;
	  };

/**
 * Verifies the caller owns the catalogue and is under their monthly
 * `ai_prompts` allowance. The limit is checked BEFORE any model call so we
 * never spend a request the user cannot afford.
 */
async function authorize(catalogueName: string): Promise<AuthResult> {
	const user = await currentUser();
	if (!user?.id) {
		return { ok: false, error: "You must be signed in.", code: "unauthorized" };
	}

	const catalogue = await drizzleClient.query.catalogues.findFirst({
		where: eq(catalogues.name, catalogueName),
		columns: { createdBy: true },
	});
	if (!catalogue) {
		return { ok: false, error: "Catalogue not found.", code: "not_found" };
	}
	if (catalogue.createdBy !== user.id) {
		return {
			ok: false,
			error: "You do not own this catalogue.",
			code: "unauthorized",
		};
	}

	const userData = await fetchUserData({ userId: user.id });
	if (userData.ok && userData.data) {
		const limit = userData.data.currentPlan?.features?.ai_prompts;
		const used = userData.data.usage?.prompts ?? 0;
		if (typeof limit === "number" && used >= limit) {
			return {
				ok: false,
				error: "You have reached your monthly AI limit.",
				code: "limit",
			};
		}
	}

	return { ok: true, userId: user.id };
}

/**
 * Records one AI usage against the monthly `ai_prompts` quota. Only called
 * after a successful model response, so failed generations are not charged.
 */
async function meter(userId: string, catalogueName: string): Promise<void> {
	await drizzleClient
		.insert(prompts)
		.values({ userId, catalogue: catalogueName });
}

/**
 * #3 — Write or improve a single item description. Returns one plain string.
 */
export async function writeItemDescription(
	catalogueName: string,
	params: {
		itemName: string;
		categoryName?: string;
		businessType?: string | null;
		language?: string;
		existing?: string;
	},
): Promise<AiActionResult<string>> {
	try {
		if (!params.itemName?.trim()) {
			return {
				success: false,
				error: "Add an item name first.",
				code: "ai_error",
			};
		}

		const auth = await authorize(catalogueName);
		if (auth.ok === false) {
			return { success: false, error: auth.error, code: auth.code };
		}

		const language = params.language || "English";
		const context = [
			params.categoryName ? `Category: "${params.categoryName}".` : "",
			params.businessType ? `Business type: ${params.businessType}.` : "",
		]
			.filter(Boolean)
			.join(" ");
		const enhance = Boolean(params.existing?.trim());

		const system = `You write short, appetizing descriptions for items in a digital catalogue or menu. Reply with ONLY the description text: one or two sentences, no quotes, no markdown, no label. Write in ${language}.`;
		const user = enhance
			? `Improve the description for the item "${params.itemName}". ${context} Keep the same meaning, fix grammar, make it clear and appealing. Current text: ${params.existing}`
			: `Write a description for the item "${params.itemName}". ${context}`;

		const raw = await generateText(system, user, { temperature: 0.7 });
		const description = raw.replace(/^["'\s]+|["'\s]+$/g, "");
		if (!description) {
			return {
				success: false,
				error: "The AI returned nothing. Try again.",
				code: "ai_error",
			};
		}

		await meter(auth.userId, catalogueName);
		return { success: true, data: description };
	} catch (error) {
		Sentry.captureException(error, { tags: { op: "writeItemDescription" } });
		return {
			success: false,
			error: "Generation failed. Try again.",
			code: "ai_error",
		};
	}
}

/**
 * #1 — Parse a raw pasted list into structured items for one block.
 */
export async function parseItemsFromText(
	catalogueName: string,
	rawText: string,
	currency: string,
): Promise<AiActionResult<GeneratedItem[]>> {
	try {
		if (!rawText?.trim()) {
			return {
				success: false,
				error: "Paste some text first.",
				code: "ai_error",
			};
		}

		const auth = await authorize(catalogueName);
		if (auth.ok === false) {
			return { success: false, error: auth.error, code: auth.code };
		}

		const system = `You convert a raw pasted list of catalogue or menu items into JSON. Output ONLY a JSON object of the form {"items":[{"name":string,"description":string,"price":number,"isFree":boolean}]}. Rules: price is a plain number in ${currency} with no symbols; use 0 when no price is given. Set isFree true only when an item is explicitly free. Keep names short and move extra detail into description. Do not invent items that are not in the text.`;
		const user = `Parse this list:\n\n${rawText}`;

		const parsed = await generateJSON<unknown>(system, user, {
			temperature: 0.2,
		});
		const result = generatedItemsSchema.safeParse(parsed);
		if (!result.success || result.data.items.length === 0) {
			return {
				success: false,
				error: "Could not read any items from that text.",
				code: "ai_error",
			};
		}

		await meter(auth.userId, catalogueName);
		return { success: true, data: toGeneratedItems(result.data.items) };
	} catch (error) {
		Sentry.captureException(error, { tags: { op: "parseItemsFromText" } });
		return {
			success: false,
			error: "Generation failed. Try again.",
			code: "ai_error",
		};
	}
}

/**
 * #2 — Generate a starter set of items for one category from a short brief.
 */
export async function generateCategoryItems(
	catalogueName: string,
	params: {
		name: string;
		description?: string;
		businessType?: string | null;
		language?: string;
		currency: string;
	},
): Promise<AiActionResult<GeneratedItem[]>> {
	try {
		if (!params.name?.trim()) {
			return {
				success: false,
				error: "Add a category name first.",
				code: "ai_error",
			};
		}

		const auth = await authorize(catalogueName);
		if (auth.ok === false) {
			return { success: false, error: auth.error, code: auth.code };
		}

		const language = params.language || "English";
		const system = `You generate a starter set of items for one category in a digital catalogue or menu. Output ONLY a JSON object of the form {"items":[{"name":string,"description":string,"price":number,"isFree":boolean}]}. Generate 4 to 8 realistic items. price is a rough plain number in ${params.currency} with no symbols. Write names and descriptions in ${language}.`;
		const brief = params.description?.trim()
			? `The user describes what they want: ${params.description}`
			: "The user gave no extra detail, so use the category name.";
		const user = `Category name: "${params.name}".${
			params.businessType ? ` Business type: ${params.businessType}.` : ""
		} ${brief}`;

		const parsed = await generateJSON<unknown>(system, user, {
			temperature: 0.6,
		});
		const result = generatedItemsSchema.safeParse(parsed);
		if (!result.success || result.data.items.length === 0) {
			return {
				success: false,
				error: "Could not generate items. Try again.",
				code: "ai_error",
			};
		}

		await meter(auth.userId, catalogueName);
		return { success: true, data: toGeneratedItems(result.data.items) };
	} catch (error) {
		Sentry.captureException(error, { tags: { op: "generateCategoryItems" } });
		return {
			success: false,
			error: "Generation failed. Try again.",
			code: "ai_error",
		};
	}
}
