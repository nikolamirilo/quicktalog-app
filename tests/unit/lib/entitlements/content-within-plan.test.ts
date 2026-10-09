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

	it("refuses the pre-rename custom_code key too", () => {
		// Otherwise sending the legacy key is a way around the gate.
		const result = contentWithinPlan(withContent("custom_code"), null, STARTER);
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

	it("counts the renamed and legacy keys as one allowance", () => {
		// A stored `custom_code` plus a new `custom_visual` is still an increase.
		const before = withContent("custom_code");
		const after = {
			content: [block("custom_code", "a"), block("custom_visual", "b")],
		} as Partial<Catalogue>;
		expect(contentWithinPlan(after, before, STARTER).ok).toBe(false);
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
