import { CatalogueSession } from "@/agent/core/session";
import type { PlanState } from "@/agent/plugins/plan";
import type { AiPlanLimits } from "@/lib/ai/limits";
import { CREDITS, estimatePlanCredits } from "@/lib/ai/pricing";
import type { CatalogueOperation } from "@/types/ai";
import type { Catalogue } from "@quicktalog/common";
import { defaultCatalogueData } from "@quicktalog/common";
import { describe, expect, it } from "vitest";

const catalogue = {
	...defaultCatalogueData,
	id: "cat-1",
	name: "cafe",
	content: [
		{
			id: "sec-1",
			order: 0,
			type: "category",
			name: "Drinks",
			layout: "variant_1",
			isExpanded: true,
			items: [
				{
					id: "it-1",
					order: 0,
					name: "Espresso",
					description: "",
					image: "",
					price: 2.5,
					isFree: false,
				},
			],
		},
		{
			id: "sec-2",
			order: 1,
			type: "text",
			name: "About",
			content: "<p>We roast every Tuesday.</p>",
		},
	],
} as Catalogue;

const session = () => new CatalogueSession(catalogue);

/** The content union has no `items` on every branch; these fixtures do. */
const itemsOf = (c: Catalogue, index: number) =>
	(c.content[index] as { items: Array<{ id: string; price: number }> }).items;

describe("CatalogueSession", () => {
	describe("index resolution", () => {
		it("resolves a section index to its stable id", () => {
			expect(session().resolveSection(0)).toEqual({ id: "sec-1" });
		});

		it("explains an out-of-range section instead of dropping it", () => {
			const result = session().resolveSection(7);

			// The model reads this back and corrects itself, which is the whole
			// reason a bad index is no longer a silent no-op.
			expect(result).toEqual({
				error: expect.stringContaining("no section [7]"),
			});
			expect((result as { error: string }).error).toContain("2 section(s)");
		});

		it("rejects item operations on a block that cannot hold items", () => {
			const result = session().resolveItemSection(1);

			expect((result as { error: string }).error).toContain(
				'is a "text" section',
			);
		});

		it("explains an out-of-range item", () => {
			const result = session().resolveItem(0, 9);

			expect((result as { error: string }).error).toContain("no item [9]");
		});
	});

	describe("run", () => {
		it("applies an edit, records it and reports a summary", () => {
			const s = session();
			const result = s.run({
				op: "update_item",
				sectionId: "sec-1",
				itemId: "it-1",
				price: 3,
			});

			expect(result.ok).toBe(true);
			expect(s.operations).toHaveLength(1);
			expect(s.applied).toHaveLength(1);
			expect(itemsOf(s.working, 0)[0].price).toBe(3);
		});

		it("leaves the working copy untouched when nothing applied", () => {
			const s = session();
			const before = s.working;
			const result = s.run({
				op: "update_section",
				sectionId: "does-not-exist",
				name: "Nope",
			});

			expect(result).toEqual({ ok: false, error: expect.any(String) });
			expect(s.operations).toHaveLength(0);
			expect(s.working).toBe(before);
		});

		it("reports a plan limit back as a tool error", () => {
			// The fixture already fills the one-section allowance.
			const s = new CatalogueSession(catalogue, { sections: 1 });
			const result = s.run({
				op: "add_section",
				id: "sec-3",
				sectionType: "items",
				name: "Food",
				items: [],
			});

			// `limitReached` is what tells the client to offer an upgrade, since the
			// refused edit never reaches the browser to be counted there.
			expect(result).toEqual({
				ok: false,
				error: expect.stringContaining("sections in the whole catalogue"),
				limitReached: true,
			});
		});

		it("keeps the id it was given so the browser mints the same one", () => {
			const s = session();
			s.run({
				op: "add_section",
				id: "sec-fixed",
				sectionType: "items",
				name: "Food",
				items: [{ id: "item-fixed", name: "Toast" }],
			});

			const index = s.working.content.findIndex((b) => b.id === "sec-fixed");
			expect(index).toBeGreaterThanOrEqual(0);
			expect(itemsOf(s.working, index)[0].id).toBe("item-fixed");
		});
	});

	describe("snapshot", () => {
		it("indexes sections and items and marks existing photos", () => {
			const s = session();
			s.run({
				op: "update_item",
				sectionId: "sec-1",
				itemId: "it-1",
				image: "https://example.com/a.jpg",
			});

			const snapshot = s.snapshot();

			expect(snapshot).toContain("SECTIONS (2):");
			expect(snapshot).toContain('[0] items "Drinks"');
			expect(snapshot).toContain('[0] "Espresso" 2.5 [img]');
			expect(snapshot).toContain("[1] text");
			// HTML is stripped so the model reads prose, not markup.
			expect(snapshot).toContain("We roast every Tuesday.");
			expect(snapshot).not.toContain("<p>");
		});

		it("reflects edits made earlier in the same turn", () => {
			const s = session();
			s.run({ op: "delete_section", sectionId: "sec-2" });

			expect(s.snapshot()).toContain("SECTIONS (1):");
		});
	});
});

describe("web fetch budget", () => {
	it("caps how many pages one request can read", () => {
		const s = session();

		expect(s.allowWebFetch()).toBeNull();
		expect(s.allowWebFetch()).toBeNull();
		expect(s.allowWebFetch()).toBeNull();
		// A fourth would be a fourth credit spent inside one 16-step loop.
		expect(s.allowWebFetch()).toEqual({
			ok: false,
			error: expect.stringContaining("limit"),
		});
	});
});

describe("partial edits", () => {
	it("tells the model which items a plan limit left out", () => {
		const full = new CatalogueSession(
			{
				...catalogue,
				content: [
					{
						id: "s1",
						order: 0,
						type: "items",
						name: "Drinks",
						showHeading: true,
						isExpanded: true,
						layout: "variant_1",
						items: Array.from({ length: 14 }, (_, i) => ({
							id: `i${i}`,
							order: i,
							name: `Item ${i}`,
							description: "",
							image: "",
							price: 1,
						})),
					},
				],
			} as Catalogue,
			{ items: 15 },
		);
		const result = full.run({
			op: "add_items",
			sectionId: "s1",
			items: [
				{ name: "A", price: 1 },
				{ name: "B", price: 1 },
			],
		});
		expect(result.ok).toBe(true);
		expect(result.ok && result.summary).toMatch(/1 item\(s\) were left out/);
	});
});

describe("credits", () => {
	const budget = (available: number, baseCoversFirstTask: boolean) => ({
		available,
		baseCoversFirstTask,
	});
	const sessionWith = (
		b: { available: number; baseCoversFirstTask: boolean },
		plan: PlanState | null = null,
		limits: Partial<AiPlanLimits> = {},
	) =>
		new CatalogueSession(
			catalogue,
			{},
			undefined,
			[],
			"user_1",
			plan,
			0,
			{
				maxFetches: 3,
				maxPlanTasks: 12,
				proModel: true,
				requireVerifiedEmail: false,
				...limits,
			},
			b,
		);
	const addSection = (name: string): CatalogueOperation => ({
		op: "add_section",
		sectionType: "items",
		name,
		items: [],
	});
	const outOfCredits = (result: unknown) =>
		(result as { outOfCredits?: true }).outOfCredits;
	const resumed = (): PlanState => ({
		revision: 2,
		tasks: [
			{ title: "Drinks", status: "pending" },
			{ title: "Food", status: "pending" },
		],
	});

	it("refuses an edit for a task the request cannot pay for, and applies nothing", () => {
		const s = sessionWith(budget(0, false), resumed());
		const result = s.run(addSection("Drinks"));
		expect(result.ok).toBe(false);
		expect(outOfCredits(result)).toBe(true);
		expect(s.operations).toHaveLength(0);
	});

	it("lets the base pay for the first task with nothing held", () => {
		const s = sessionWith(budget(0, true));
		s.createPlan(["Drinks", "Food"]);
		expect(s.run(addSection("Drinks")).ok).toBe(true);
	});

	it("refuses an unplanned edit on a continuation", () => {
		const s = sessionWith(budget(5, false));
		const result = s.run(addSection("Drinks"));
		expect(result.ok).toBe(false);
		expect(outOfCredits(result)).toBeUndefined();
		expect(s.operations).toHaveLength(0);
	});

	it("an edit after the plan is finished on a continuation is not an out-of-credits refusal", () => {
		const finished: PlanState = {
			revision: 3,
			tasks: [
				{ title: "Drinks", status: "done" },
				{ title: "Food", status: "done" },
			],
		};
		const s = sessionWith(budget(10, false), finished);
		const result = s.run(addSection("Extra"));
		expect(result.ok).toBe(false);
		expect(outOfCredits(result)).toBeUndefined();
		expect((result as { error?: string }).error).toMatch(/new ask/);
	});

	it("refuses a plan longer than the balance pays for, naming what fits", () => {
		const s = sessionWith(budget(2, true));
		const refused = s.createPlan(["a", "b", "c", "d"]);
		expect((refused as { error?: string }).error).toMatch(/3 tasks/);
		expect(s.createPlan(["a", "b", "c"]).ok).toBe(true);
	});

	it("Starter at 13 of 15 gets one change, not a checklist", () => {
		const s = sessionWith(budget(0, true), null, {
			maxPlanTasks: 4,
			maxFetches: 0,
		});
		const refused = s.createPlan(["a", "b", "c", "d"]);
		expect((refused as { error?: string }).error).toMatch(
			/single most important change/,
		);
		expect(s.run(addSection("Drinks")).ok).toBe(true);
		expect(s.credits.billed).toBe(0);
	});

	it("a 4-task build bills what the price list says", () => {
		const s = sessionWith(budget(18, true));
		s.createPlan(["a", "b", "c", "d"]);
		for (let task = 0; task < 4; task++) {
			s.run(addSection(`Section ${task}`));
			s.completeTask(task);
		}
		expect(s.credits.billed).toBe(estimatePlanCredits(4) - CREDITS.agentBase);
	});
});
