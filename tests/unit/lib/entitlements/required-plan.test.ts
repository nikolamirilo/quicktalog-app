import type { LimitType, PricingPlan } from "@quicktalog/common";
import { describe, expect, it } from "vitest";
import { getRequiredPlan } from "@/lib/entitlements/required-plan";

describe("getRequiredPlan", () => {
	const tiers = [
		{
			id: 1,
			type: "standard",
			features: {
				catalogues: 1,
				ai_credits: 0,
				items_per_catalogue: 10,
				sections_per_catalogue: 3,
				traffic_limit: 100,
			},
		},
		{
			id: 2,
			type: "standard",
			features: {
				catalogues: 5,
				ai_credits: 40,
				items_per_catalogue: 50,
				sections_per_catalogue: 10,
				traffic_limit: 1000,
			},
		},
		{
			id: 3,
			type: "standard",
			features: {
				catalogues: "unlimited",
				ai_credits: 300,
				items_per_catalogue: "unlimited",
				sections_per_catalogue: "unlimited",
				traffic_limit: 10000,
			},
		},
	] as unknown as PricingPlan[];

	const plan = (limit: LimitType, from: PricingPlan) =>
		getRequiredPlan(from, limit, tiers);

	it("returns the next tier that raises the catalogue limit", () => {
		expect(plan("catalogue", tiers[0])).toBe(tiers[1]);
	});

	it("returns the next tier that unlocks an AI quota", () => {
		expect(plan("ai", tiers[0])).toBe(tiers[1]);
	});

	it("treats an 'unlimited' target tier as an upgrade", () => {
		expect(plan("catalogue", tiers[1])).toBe(tiers[2]);
	});

	it("falls back to the last standard tier when already unlimited", () => {
		expect(plan("catalogue", tiers[2])).toBe(tiers[2]);
	});

	it("returns the last standard tier for the 'notFound' limit type", () => {
		expect(plan("notFound", tiers[0])).toBe(tiers[2]);
	});
});
