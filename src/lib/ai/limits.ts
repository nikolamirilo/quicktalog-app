import "server-only";
import type { Tier } from "@/lib/entitlements/plan";

/**
 * What one AI turn may spend, by plan. The free tier now has credits, so these
 * are the controls that keep an unpaid account from costing real money: page
 * reads are the only hard per-call cash cost in the loop, and a shorter plan
 * bounds the worst single ask.
 */
export type AiPlanLimits = {
	maxFetches: number;
	maxPlanTasks: number;
	/** False picks the cheaper model. */
	proModel: boolean;
	requireVerifiedEmail: boolean;
};

/** Starter: the plan every new account is provisioned on. */
const FREE_PLAN_ID = 0;

const FREE: AiPlanLimits = {
	maxFetches: 0,
	maxPlanTasks: 4,
	proModel: false,
	requireVerifiedEmail: true,
};
const PAID: AiPlanLimits = {
	maxFetches: 3,
	maxPlanTasks: 12,
	proModel: true,
	requireVerifiedEmail: false,
};

export function aiLimitsFor(plan: Tier): AiPlanLimits {
	return plan.id === FREE_PLAN_ID ? FREE : PAID;
}
