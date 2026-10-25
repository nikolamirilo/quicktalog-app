import "server-only";
import { createHash } from "node:crypto";
import { sql } from "drizzle-orm";
import type { VerifiedIdentity } from "@/lib/auth/identity";
import { aiLimitsFor, requestHoldFor } from "@/lib/ai/limits";
import { getPlanForUpdate, type Tier } from "@/lib/entitlements/plan";
import { withinRateLimit } from "@/lib/rate-limit";
import { type Tx, withUser } from "@/utils/db";

export type AiTurnOutcome =
	| "charged"
	| "continued"
	| "limit"
	| "not_found"
	| "unverified";

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
		credits: number;
	},
): Promise<{
	plan: Tier;
	turn: { outcome: AiTurnOutcome; turnId: string | null; held: number };
}> {
	return withUser(me, async (tx) => {
		const plan = await getPlanForUpdate(tx, me);
		const limit =
			typeof plan.features.ai_credits === "number"
				? plan.features.ai_credits
				: null;
		// Derived from the plan read in this same transaction, so the caller
		// cannot be out of step with the tier the charge is made against.
		const ai = aiLimitsFor(plan);
		const rows = await tx.execute<{
			outcome: AiTurnOutcome;
			ai_turn_id: string | null;
			held: number | null;
		}>(sql`
			select outcome, ai_turn_id, held
			  from private.begin_ai_turn(${a.catalogue}, ${limit}::int, ${a.kind},
			       ${a.continuationOf}::uuid, ${a.plan ? planHash(a.plan) : null}::text,
			       ${a.credits}::int, ${ai.requireVerifiedEmail}::boolean,
			       ${requestHoldFor(ai)}::int)`);
		const row = [...rows][0];
		return {
			plan,
			turn: {
				outcome: row?.outcome ?? "not_found",
				turnId: row?.ai_turn_id ?? null,
				held: Number(row?.held ?? 0),
			},
		};
	});
}

/** Both AI entry points share one budget, so neither is a way around the other. */
export async function aiRateLimitOk(userId: string): Promise<boolean> {
	const [burst, hourly] = await Promise.all([
		withinRateLimit("aiBurst", userId),
		withinRateLimit("aiHourly", userId),
	]);
	return burst && hourly;
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

/**
 * Moves what a request spent from its hold into its charge. The database never
 * moves more than is held, so the balance cannot pass the allowance; the return
 * value is what it actually moved.
 */
export async function spendAiHold(
	tx: Tx,
	turnId: string,
	credits: number,
): Promise<number> {
	if (credits <= 0) return 0;
	const rows = await tx.execute<{ moved: number }>(
		sql`select private.spend_ai_hold(${turnId}::uuid, ${credits}::int) as moved`,
	);
	return Number([...rows][0]?.moved ?? 0);
}

/** Gives back what a request held and did not spend. */
export async function releaseAiHold(tx: Tx, turnId: string): Promise<void> {
	await tx.execute(sql`select private.release_ai_hold(${turnId}::uuid)`);
}

/** Reverses a charge for a turn that produced nothing. Only the owner's own turn. */
export async function refundAiTurn(tx: Tx, turnId: string): Promise<boolean> {
	const rows = await tx.execute<{ refunded: boolean }>(
		sql`select private.refund_ai_turn(${turnId}::uuid) as refunded`,
	);
	return [...rows][0]?.refunded === true;
}
