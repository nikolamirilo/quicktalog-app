/**
 * What a turn costs. The base is charged before any model spend; the rest is
 * settled once the turn is over. A turn that applied nothing is refunded, so
 * asking a question stays free.
 *
 * No `server-only`: the builder shows the price of a plan before it runs, and
 * that estimate has to come from the same numbers the server charges.
 */
export const CREDITS = {
	agentBase: 2,
	describe: 1,
	perExtraTask: 1,
	perPageFetch: 2,
} as const;

/** What a plan of `taskCount` tasks costs if every task lands and nothing is fetched. */
export function estimatePlanCredits(taskCount: number): number {
	return CREDITS.agentBase + Math.max(0, taskCount - 1) * CREDITS.perExtraTask;
}
