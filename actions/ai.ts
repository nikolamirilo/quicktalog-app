"use server";
import { authorize, meter } from "@/lib/ai/access";
import type { AiActionResult } from "@/types/ai";
import { generateText } from "@/utils/deepseek";
import * as Sentry from "@sentry/nextjs";

/**
 * Write or improve a single item description. Returns one plain string.
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
