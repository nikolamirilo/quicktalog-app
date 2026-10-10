import { CatalogueSession } from "@/agent/session";
import { buildTools } from "@/agent/tools";
import { aiLimitsFor } from "@/lib/ai/limits";
import { CREDITS } from "@/lib/ai/pricing";
import type { Tier } from "@/lib/entitlements/plan";
import { defaultCatalogueData, tiers } from "@quicktalog/common";
import type { Catalogue } from "@quicktalog/common";
import { describe, expect, it } from "vitest";

const catalogue = {
	...defaultCatalogueData,
	id: "c1",
	name: "cafe",
} as Catalogue;

const sessionOn = (tier: Tier) =>
	new CatalogueSession(
		catalogue,
		{},
		undefined,
		[],
		"user_1",
		null,
		0,
		aiLimitsFor(tier),
	);

const starter = tiers[0];
const pro = tiers.find((t) => t.id === 2) as Tier;

describe("free plan AI guards", () => {
	it("refuses a page read and says it is the plan, not the budget", () => {
		const result = sessionOn(starter).allowWebFetch();
		expect(result?.ok).toBe(false);
		expect(result && "error" in result ? result.error : "").toMatch(
			/not available on this plan/i,
		);
	});

	it("drops fetchUrl from the toolset so no step is wasted discovering it", () => {
		expect(buildTools(sessionOn(starter))).not.toHaveProperty("fetchUrl");
		expect(buildTools(sessionOn(pro))).toHaveProperty("fetchUrl");
	});

	it("caps a free plan at four tasks", () => {
		const five = ["a", "b", "c", "d", "e"];
		const refused = sessionOn(starter).createPlan(five);
		expect(refused.ok).toBe(false);
		expect(sessionOn(starter).createPlan(["a", "b", "c", "d"]).ok).toBe(true);
	});

	it("still allows a long plan on a paid tier", () => {
		expect(sessionOn(pro).createPlan(["a", "b", "c", "d", "e"]).ok).toBe(true);
	});

	it("lets a paid plan read pages up to its budget, then stops", () => {
		const session = sessionOn(pro);
		expect(session.allowWebFetch()).toBeNull();
		expect(session.allowWebFetch()).toBeNull();
		expect(session.allowWebFetch()).toBeNull();
		expect(session.allowWebFetch()?.ok).toBe(false);
	});

	it("counts only pages read in this request, so a resume is not charged twice", () => {
		// Seeded with two already read earlier in the same ask.
		const session = new CatalogueSession(
			catalogue,
			{},
			undefined,
			[],
			"user_1",
			null,
			2,
			aiLimitsFor(pro),
		);
		expect(session.fetchesThisRequest).toBe(0);
		session.allowWebFetch();
		expect(session.fetchesThisRequest).toBe(1);
	});
});

describe("what a turn is charged for", () => {
	// The regression that put a free user on 16 of 15 credits: `applied` holds one
	// entry per edit, so a single task adding ten items looked like ten tasks.
	it("counts completed tasks, not the edits they made", () => {
		const session = sessionOn(pro);
		session.createPlan(["Add drinks", "Add food"]);
		session.applied.push("Added item 1", "Added item 2", "Added item 3");
		session.completeTask(0);
		expect(session.tasksSettledThisRequest).toBe(1);
	});

	it("does not charge for a skipped task", () => {
		const session = sessionOn(pro);
		session.createPlan(["Add drinks", "Add food"]);
		session.skipTask(0, "nothing to add");
		expect(session.tasksSettledThisRequest).toBe(0);
	});

	it("keeps a free build inside the free allowance", () => {
		const session = sessionOn(starter);
		session.createPlan(["a", "b", "c", "d"]);
		for (let i = 0; i < 4; i++) session.completeTask(i);
		// base 2 + (4 settled - 1), no page reads on the free plan.
		const cost = CREDITS.agentBase + (session.tasksSettledThisRequest - 1);
		expect(cost).toBe(5);
		expect(cost).toBeLessThan(tiers[0].features.ai_credits);
	});
});
