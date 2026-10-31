import { contentWithinPlan } from "@/lib/entitlements/plan";
import type { Catalogue } from "@quicktalog/common";
import { tiers } from "@quicktalog/common";
import { describe, expect, it } from "vitest";

/**
 * The server-side gate on `content`. The builder and the agent both refuse a
 * locked block type already, but neither is a control: `content` arrives from
 * the client on every save, so this is the only thing standing between a
 * crafted payload and a paid block on a free plan.
 *
 * Judged like the section and item counts beside it - refused only when the
 * save *adds* one. A user who downgrades keeps what they had and can go on
 * editing; they just cannot add more.
 */

const tierNamed = (name: string) => {
	const tier = tiers.find((t) => t.name === name);
	if (!tier) throw new Error(`No tier named ${name}`);
	return tier;
};

const STARTER = tierNamed("Starter");
const PRO = tierNamed("Pro");
const GROWTH = tierNamed("Growth");

const block = (type: string, id = type) => ({ id, order: 0, type }) as never;

const withContent = (...types: string[]): Partial<Catalogue> =>
	({
		content: types.map((t, i) => block(t, `${t}-${i}`)),
	}) as Partial<Catalogue>;

describe("contentWithinPlan block types", () => {
	it("allows the types every plan includes", () => {
		const result = contentWithinPlan(
			withContent("items", "text"),
			null,
			STARTER,
		);
		expect(result.ok).toBe(true);
	});

	it("refuses a divider on a plan without it", () => {
		const result = contentWithinPlan(withContent("divider"), null, STARTER);
		expect(result.ok).toBe(false);
		expect(result.reason).toMatch(/Divider/);
	});

	it("refuses an embed on a plan without it", () => {
		const result = contentWithinPlan(withContent("embedding"), null, STARTER);
		expect(result.ok).toBe(false);
		expect(result.reason).toMatch(/External content/);
	});

	it("refuses a custom visual on a plan without it", () => {
		const result = contentWithinPlan(
			withContent("custom_visual"),
			null,
			STARTER,
		);
		expect(result.ok).toBe(false);
		expect(result.reason).toMatch(/Custom visual/);
	});

	it("allows a type the plan does include", () => {
		expect(contentWithinPlan(withContent("custom_visual"), null, PRO).ok).toBe(
			true,
		);
		expect(contentWithinPlan(withContent("embedding"), null, PRO).ok).toBe(
			true,
		);
		expect(contentWithinPlan(withContent("divider"), null, GROWTH).ok).toBe(
			true,
		);
	});

	it("lets a downgraded user keep and re-save the blocks they already had", () => {
		const existing = withContent("embedding", "custom_visual");
		const result = contentWithinPlan(existing, existing, STARTER);
		expect(result.ok).toBe(true);
	});

	it("lets a downgraded user remove one of them", () => {
		const before = withContent("embedding", "embedding");
		const after = withContent("embedding");
		expect(contentWithinPlan(after, before, STARTER).ok).toBe(true);
	});

	it("still refuses a downgraded user adding another", () => {
		const before = withContent("embedding");
		const after = withContent("embedding", "embedding");
		const result = contentWithinPlan(after, before, STARTER);
		expect(result.ok).toBe(false);
		expect(result.reason).toMatch(/External content/);
	});

	it("ignores content that is not an array", () => {
		expect(contentWithinPlan({}, null, STARTER).ok).toBe(true);
	});

	it("checks every gated type, not just the first", () => {
		// Pro has embedding and custom_visual but is judged on all three.
		const result = contentWithinPlan(withContent("items"), null, PRO);
		expect(result.ok).toBe(true);
	});
});

describe("contentWithinPlan counts", () => {
	it("counts text blocks against the section limit", () => {
		const result = contentWithinPlan(
			withContent("items", "items", "items", "items", "text", "text"),
			null,
			STARTER,
		);
		expect(result.ok).toBe(false);
		expect(result.reason).toMatch(/5 sections/);
	});

	it("counts items only in items blocks", () => {
		const content = [
			{ id: "a", order: 0, type: "items", items: Array(15).fill({}) },
			{ id: "b", order: 1, type: "text", items: Array(5).fill({}) },
		];
		expect(
			contentWithinPlan({ content } as Partial<Catalogue>, null, STARTER).ok,
		).toBe(true);
	});
});

describe("the save is the hard limit", () => {
	it("refuses a Basic draft that grows from 30 to 50 items", () => {
		const items = (count: number) =>
			({
				content: [
					{ id: "a", order: 0, type: "items", items: Array(count).fill({}) },
				],
			}) as Partial<Catalogue>;
		const result = contentWithinPlan(items(50), items(30), tierNamed("Basic"));
		expect(result.ok).toBe(false);
		expect(result.reason).toMatch(/30 items/);
	});
});
