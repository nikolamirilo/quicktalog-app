import "server-only";
import { createHash } from "node:crypto";
import { sql } from "drizzle-orm";
import type { VerifiedIdentity } from "@/lib/auth/identity";
import { getPlanForUpdate, type Tier } from "@/lib/entitlements/plan";
import { type Tx, withUser } from "@/utils/db";

export type AiTurnOutcome = "charged" | "continued" | "limit" | "not_found";
export type Plan = {
	revision: number;
	tasks: { title: string; status: string }[];
};

/**
 * Canonical hash of a plan. The server stores it when a turn ends, and a
 * continuation must resend a plan that hashes to the same value, so a client
 * cannot claim to be continuing a turn it invented.
 */
export function planHash(plan: Plan): string {
	const canonical = JSON.stringify({
		r: plan.revision,
		t: plan.tasks.map((t) => [t.title, t.status]),
	});
	return createHash("sha256").update(canonical).digest("hex");
}

/**
 * Charges an AI turn **before** any model spend, in the same transaction that
 * read the plan. A function killed at the 60s limit therefore stays charged,
 * and a refund is an explicit decision rather than the default.
 */
export function startAiTurn(
	me: VerifiedIdentity,
	a: {
		catalogue: string;
		kind: "agent" | "describe";
		continuationOf: string | null;
		plan: Plan | null;
	},
): Promise<{
	plan: Tier;
	turn: { outcome: AiTurnOutcome; turnId: string | null };
}> {
	return withUser(me, async (tx) => {
		const plan = await getPlanForUpdate(tx, me);
		const limit =
			typeof plan.features.ai_prompts === "number"
				? plan.features.ai_prompts
				: null;
		const rows = await tx.execute<{
			outcome: AiTurnOutcome;
			ai_turn_id: string | null;
		}>(sql`
			select outcome, ai_turn_id
			  from private.begin_ai_turn(${a.catalogue}, ${limit}::int, ${a.kind},
			       ${a.continuationOf}::uuid, ${a.plan ? planHash(a.plan) : null}::text)`);
		const row = [...rows][0];
		return {
			plan,
			turn: {
				outcome: row?.outcome ?? "not_found",
				turnId: row?.ai_turn_id ?? null,
			},
		};
	});
}

/** Records whether the turn left an open plan, and the budget of free continuations. */
export async function setPlanState(
	tx: Tx,
	turnId: string,
	plan: Plan | null,
): Promise<void> {
	const pending = plan
		? plan.tasks.filter((t) => t.status !== "done").length
		: 0;
	await tx.execute(
		sql`select private.set_plan_state(${turnId}::uuid, ${pending > 0}, ${pending}::int,
			${plan ? planHash(plan) : null}::text)`,
	);
}

/** Reverses a charge for a turn that produced nothing. Only the owner's own turn. */
export async function refundAiTurn(tx: Tx, turnId: string): Promise<boolean> {
	const rows = await tx.execute<{ refunded: boolean }>(
		sql`select private.refund_ai_turn(${turnId}::uuid) as refunded`,
	);
	return [...rows][0]?.refunded === true;
}
