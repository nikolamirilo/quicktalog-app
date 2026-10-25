import {
	canAddItem,
	operationLimitsFor,
} from "@/lib/entitlements/operation-limits";
import { tiers } from "@quicktalog/common";
import { describe, expect, it } from "vitest";

const tier = (name: string) => {
	const found = tiers.find((t) => t.name === name);
	if (!found) throw new Error(`No tier named ${name}`);
	return found;
};

describe("operationLimitsFor", () => {
	it("maps Starter the way the builder locks it", () => {
		expect(operationLimitsFor(tier("Starter").features)).toEqual({
			sections: 5,
			items: 15,
			sectionTypes: { divider: false, embedding: false, customVisual: false },
			branding: false,
			advancedAppearance: false,
			newsletter: false,
		});
	});

	it("unlocks advanced appearance on Pro but not the newsletter", () => {
		const limits = operationLimitsFor(tier("Pro").features);
		expect(limits.advancedAppearance).toBe(true);
		expect(limits.newsletter).toBe(false);
	});

	it("unlocks the newsletter on Growth", () => {
		expect(operationLimitsFor(tier("Growth").features).newsletter).toBe(true);
	});

	it("limits survive a JSON round trip for every tier", () => {
		for (const t of tiers) {
			const limits = operationLimitsFor(t.features);
			expect(JSON.parse(JSON.stringify(limits))).toEqual(limits);
		}
	});
});

describe("canAddItem", () => {
	const content = (count: number) => [
		{ id: "a", order: 0, type: "items", items: Array(count).fill({}) },
	];

	it("stops at the limit", () => {
		expect(canAddItem(content(29), 30)).toBe(true);
		expect(canAddItem(content(30), 30)).toBe(false);
		expect(canAddItem(content(31), 30)).toBe(false);
	});

	it("never stops an unlimited plan", () => {
		expect(canAddItem(content(500), "unlimited")).toBe(true);
		expect(canAddItem(content(500), undefined)).toBe(true);
	});
});
