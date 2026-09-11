import { fetchUserData } from "@/lib/users/fetchUserData";
import type { AiActionResult, AiSectionAccess } from "@/types/ai";
import type { OperationLimits } from "@/helpers/catalogueOperations";
import { drizzleClient } from "@/utils/drizzle";
import { currentUser } from "@clerk/nextjs/server";
import { schema } from "@quicktalog/common";
import { eq } from "drizzle-orm";

const catalogues = schema.catalogues;
const prompts = schema.prompts;

export type AuthResult =
	| {
			ok: true;
			userId: string;
			sectionAccess?: AiSectionAccess;
			limits: OperationLimits;
	  }
	| {
			ok: false;
			error: string;
			code: NonNullable<AiActionResult<unknown>["code"]>;
	  };

/**
 * Verifies the caller owns the catalogue and is under their monthly
 * `ai_prompts` allowance. The limit is checked BEFORE any model call so we
 * never spend a request the user cannot afford.
 *
 * Ownership is always re-read from the database: the catalogue itself arrives
 * from the client so unsaved builder state is in context, and that payload
 * cannot be trusted to say who owns it.
 */
export async function authorize(catalogueName: string): Promise<AuthResult> {
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
	// Fail closed: a failed lookup must not hand out an uncapped, fully unlocked
	// turn, so fall back to the most restrictive footing we can express.
	if (!userData.ok || !userData.data) {
		return {
			ok: false,
			error: "Could not check your plan. Try again in a moment.",
			code: "not_found",
		};
	}

	const features = userData.data.currentPlan?.features;
	const limit = features?.ai_prompts;
	const used = userData.data.usage?.prompts ?? 0;
	if (typeof limit === "number" && used >= limit) {
		return {
			ok: false,
			error: "You have reached your monthly AI limit.",
			code: "limit",
		};
	}

	return {
		ok: true,
		userId: user.id,
		sectionAccess: features?.sections,
		limits: {
			sections: features?.sections_per_catalogue,
			items: features?.items_per_catalogue,
			sectionTypes: features?.sections,
		},
	};
}

/**
 * Records one AI usage against the monthly `ai_prompts` quota. Callers meter
 * only after the model has actually done something, so a turn that changed
 * nothing is not charged.
 */
export async function meter(
	userId: string,
	catalogueName: string,
): Promise<void> {
	await drizzleClient
		.insert(prompts)
		.values({ userId, catalogue: catalogueName });
}
