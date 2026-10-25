export type CancelDecision = "downgrade" | "keep" | "unexplained";

/**
 * What a `subscription.canceled` event does to the user's plan.
 *
 * - `keep`: another subscription of the customer is still live, e.g. the new
 *   one of a plan change, which cancels the old one after it is active.
 * - `downgrade`: the subscription behind the user's current plan ended.
 * - `unexplained`: nothing live is left, yet the user's plan is a different
 *   price. Either an upgrade whose new subscription we never stored, or a price
 *   changed on the Paddle side. Moving the user to free on a guess is worse
 *   than leaving the plan, so it is kept and reported.
 */
export function cancelDecision({
	currentPlanId,
	canceledPriceId,
	otherStatuses,
}: {
	currentPlanId: string;
	canceledPriceId: string | null;
	otherStatuses: string[];
}): CancelDecision {
	if (otherStatuses.some((status) => status !== "canceled")) return "keep";
	return currentPlanId === canceledPriceId ? "downgrade" : "unexplained";
}
