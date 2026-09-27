import { aiLimitsFor } from "@/lib/ai/limits";
import type { Tier } from "@/lib/entitlements/plan";
import { tiers } from "@quicktalog/common";
import { describe, expect, it } from "vitest";

const starter = tiers[0];
const paid = tiers.find((tier) => tier.id === 2) as Tier;

describe("aiLimitsFor", () => {
	it("gives the free plan no page reads at all", () => {
		// Firecrawl is the only hard per-call cash cost, and the only surface that
		// pulls a stranger's content into a model holding write tools.
		expect(aiLimitsFor(starter).maxFetches).toBe(0);
	});

	it("keeps the free plan on the cheap model and a short plan", () => {
		expect(aiLimitsFor(starter).proModel).toBe(false);
		expect(aiLimitsFor(starter).maxPlanTasks).toBe(4);
	});

	it("makes the free plan confirm its email, and does not ask paid plans to", () => {
		// Anti-farming only; a paid account has already given Paddle a card.
		expect(aiLimitsFor(starter).requireVerifiedEmail).toBe(true);
		expect(aiLimitsFor(paid).requireVerifiedEmail).toBe(false);
	});

	it("leaves paid plans unrestricted", () => {
		const limits = aiLimitsFor(paid);
		expect(limits.maxFetches).toBe(3);
		expect(limits.proModel).toBe(true);
		expect(limits.maxPlanTasks).toBe(12);
	});

	it("treats every tier that is not Starter as paid", () => {
		for (const tier of tiers.filter((t) => t.id !== 0)) {
			expect(aiLimitsFor(tier).maxFetches).toBeGreaterThan(0);
		}
	});
});
