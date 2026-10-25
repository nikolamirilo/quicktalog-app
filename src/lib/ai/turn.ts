import type { RequestBudget } from "@/agent/core/credits";
import { type AiPlanLimits, aiLimitsFor } from "@/lib/ai/limits";
import { type Plan, startAiTurn } from "@/lib/ai/metering";
import { CREDITS } from "@/lib/ai/pricing";
import type { VerifiedIdentity } from "@/lib/auth/identity";
import type { OperationLimits } from "@/lib/catalogue/operations";
import { operationLimitsFor } from "@/lib/entitlements/operation-limits";
import type { AiActionResult, AiSectionAccess } from "@/types/ai";
import "server-only";

export type TurnGrant = {
	ok: true;
	turnId: string | null;
	/** True when this request took a charge; a continuation rides on the root turn. */
	charged: boolean;
	sectionAccess?: AiSectionAccess;
	limits: OperationLimits;
	/** What this plan lets one turn spend; see lib/ai/limits.ts. */
	ai: AiPlanLimits;
	/** What the database holds for this request beyond the base. */
	budget: RequestBudget;
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
		credits: a.kind === "agent" ? CREDITS.agentBase : CREDITS.describe,
	});

	if (start.turn.outcome === "not_found") {
		return { ok: false, error: "Catalogue not found.", code: "not_found" };
	}
	if (start.turn.outcome === "unverified") {
		return {
			ok: false,
			error: "Confirm your email address to use Quick AI.",
			code: "unverified",
		};
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
		limits: operationLimitsFor(features),
		ai: aiLimitsFor(start.plan),
		budget: {
			available: start.turn.held,
			baseCoversFirstTask: start.turn.outcome === "charged",
		},
	};
}

/**
 * What a request owes when it ends. A turn that changed nothing, opened no plan
 * and bought nothing (no page read, no task) is refunded, so a question stays
 * free; otherwise whatever the steps have not written yet is charged now.
 */
export function closingCharge(a: {
	charged: boolean;
	applied: number;
	planOpen: boolean;
	billed: number;
	persisted: number;
}): { refund: boolean; spend: number } {
	if (a.charged && a.applied === 0 && !a.planOpen && a.billed === 0) {
		return { refund: true, spend: 0 };
	}
	return { refund: false, spend: Math.max(0, a.billed - a.persisted) };
}
