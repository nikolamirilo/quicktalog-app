import "server-only";
import type { OperationLimits } from "@/helpers/catalogueOperations";
import type { VerifiedIdentity } from "@/lib/auth/identity";
import { type Plan, startAiTurn } from "@/lib/ai/metering";
import type { AiActionResult, AiSectionAccess } from "@/types/ai";

export type TurnGrant = {
	ok: true;
	turnId: string | null;
	/** True when this request took a charge; a continuation rides on the root turn. */
	charged: boolean;
	sectionAccess?: AiSectionAccess;
	limits: OperationLimits;
};

export type TurnDenial = {
	ok: false;
	error: string;
	code: NonNullable<AiActionResult<unknown>["code"]>;
};

/**
 * Opens an AI turn: proves the caller owns the catalogue, charges the turn
 * against their monthly allowance and returns the limits the agent must work
 * within. All of it happens in the database, in one transaction, **before** any
 * model call, so a request killed mid-flight is still accounted for and two
 * parallel requests cannot both pass the same allowance check.
 *
 * Ownership is never taken from the request: the catalogue payload comes from
 * the browser so unsaved builder edits are in context, and that payload cannot
 * be trusted to say who owns it.
 */
export async function openAiTurn(
	me: VerifiedIdentity,
	a: {
		catalogue: string;
		kind: "agent" | "describe";
		continuationOf?: string | null;
		plan?: Plan | null;
	},
): Promise<TurnGrant | TurnDenial> {
	const start = await startAiTurn(me, {
		catalogue: a.catalogue,
		kind: a.kind,
		continuationOf: a.continuationOf ?? null,
		plan: a.plan ?? null,
	});

	if (start.turn.outcome === "not_found") {
		return { ok: false, error: "Catalogue not found.", code: "not_found" };
	}
	if (start.turn.outcome === "limit") {
		return {
			ok: false,
			error: "You have reached your monthly AI limit.",
			code: "limit",
		};
	}

	const features = start.plan.features;
	return {
		ok: true,
		turnId: start.turn.turnId,
		charged: start.turn.outcome === "charged",
		sectionAccess: features.sections,
		limits: {
			sections: features.sections_per_catalogue,
			items: features.items_per_catalogue,
			sectionTypes: features.sections,
			branding: features.branding,
		},
	};
}
