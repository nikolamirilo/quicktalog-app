import { tiers } from "@quicktalog/common";
import { describe, expect, it } from "vitest";

import {
	getFeatureList,
	planFeatureGroups,
	planLimitRows,
} from "@/constants/pricing";

const texts = (tier: (typeof tiers)[number]) =>
	getFeatureList(tier.features).map((feature) => feature.text);

describe("plan card features", () => {
	it("card features use the overview labels", () => {
		const basic = tiers.find((tier) => tier.name === "Basic")!;
		expect(texts(basic)).toEqual([
			"1 catalogue",
			"8 sections per catalogue",
			"30 items per catalogue",
			"2,000 page views / 30 days",
			"50 AI credits / 30 days",
			"Custom branding",
			"Basic analytics",
			"Email support",
		]);
	});

	it("lists only included highlights, worded as in the overview", () => {
		const premium = tiers.find((tier) => tier.name === "Premium")!;
		const overviewLabels = planFeatureGroups(premium.features).flatMap(
			(group) => group.rows.map((row) => row.label),
		);
		for (const label of [
			"Advanced styling",
			"Your own analytics tags",
			"Newsletter sign-ups",
			"Custom features",
		]) {
			expect(texts(premium)).toContain(label);
			expect(overviewLabels).toContain(label);
		}
	});

	it("gives every card line a unique type", () => {
		for (const tier of tiers) {
			const types = getFeatureList(tier.features).map((f) => f.type);
			expect(new Set(types).size).toBe(types.length);
		}
	});

	it("labels the overview limits from the same rows", () => {
		expect(planLimitRows(tiers[0].features).map((row) => row.label)).toEqual([
			"Catalogues",
			"Sections per catalogue",
			"Items per catalogue",
			"Page views / 30 days",
			"AI credits / 30 days",
		]);
	});
});
