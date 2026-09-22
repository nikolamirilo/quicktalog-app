"use server";
import { getVerifiedIdentity } from "@/lib/auth/identity";
import { refundAiTurn } from "@/lib/ai/metering";
import { openAiTurn } from "@/lib/ai/turn";
import type { AiActionResult } from "@/types/ai";
import { withUser } from "@/utils/db";
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

		const me = await getVerifiedIdentity();
		if (!me) {
			return {
				success: false,
				error: "You must be signed in.",
				code: "unauthorized",
			};
		}

		// Charged before the model runs, refunded below on empty output.
		const turn = await openAiTurn(me, {
			catalogue: catalogueName,
			kind: "describe",
		});
		if (turn.ok === false) {
			return { success: false, error: turn.error, code: turn.code };
		}

		const refund = async () => {
			if (!turn.turnId || !turn.charged) return;
			try {
				await withUser(me, (tx) => refundAiTurn(tx, turn.turnId!));
			} catch (error) {
				Sentry.captureException(error, {
					level: "warning",
					tags: { op: "writeItemDescription", step: "refund" },
				});
			}
		};

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

		let raw: string;
		try {
			raw = await generateText(system, user, { temperature: 0.7 });
		} catch (error) {
			await refund();
			throw error;
		}

		const description = raw.replace(/^["'\s]+|["'\s]+$/g, "");
		if (!description) {
			await refund();
			return {
				success: false,
				error: "The AI returned nothing. Try again.",
				code: "ai_error",
			};
		}

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
