import { CREDITS, estimatePlanCredits } from "@/lib/ai/pricing";
import { describe, expect, it } from "vitest";

describe("estimatePlanCredits", () => {
	it("charges the base once and one credit per task beyond the first", () => {
		// The figure the builder shows before a plan runs; §2.4's worked example.
		expect(estimatePlanCredits(4)).toBe(5);
	});

	it("costs the bare base for a one-task plan", () => {
		expect(estimatePlanCredits(1)).toBe(CREDITS.agentBase);
	});

	it("never goes below the base", () => {
		expect(estimatePlanCredits(0)).toBe(CREDITS.agentBase);
	});

	it("keeps a description the smallest useful action", () => {
		// "1 credit is one AI-written description" is what the pricing page sells.
		expect(CREDITS.describe).toBe(1);
	});
});
