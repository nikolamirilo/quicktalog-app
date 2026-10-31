import { describe, expect, it } from "vitest";

import { cancelDecision } from "@/lib/paddle/downgrade";

describe("cancelDecision", () => {
	it("keeps the plan while another subscription is not canceled", () => {
		expect(
			cancelDecision({
				currentPlanId: "pri_growth",
				canceledPriceId: "pri_basic",
				otherStatuses: ["active"],
			}),
		).toBe("keep");
		expect(
			cancelDecision({
				currentPlanId: "pri_basic",
				canceledPriceId: "pri_basic",
				otherStatuses: ["canceled", "past_due"],
			}),
		).toBe("keep");
	});

	it("downgrades when the current plan's subscription ends", () => {
		expect(
			cancelDecision({
				currentPlanId: "pri_basic",
				canceledPriceId: "pri_basic",
				otherStatuses: ["canceled"],
			}),
		).toBe("downgrade");
	});

	it("does not downgrade an unexplained cancel of a subscription that is not the current plan", () => {
		expect(
			cancelDecision({
				currentPlanId: "pri_basic_year",
				canceledPriceId: "pri_basic_month",
				otherStatuses: [],
			}),
		).toBe("unexplained");
	});
});
