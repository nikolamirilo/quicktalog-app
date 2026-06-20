import type { LimitType, PricingPlan } from "@quicktalog/common";
import { describe, expect, it } from "vitest";
import {
	formatPrice,
	getCurrencySymbol,
	getRequiredPlan,
	validateStepHelper,
} from "@/helpers/client";

describe("formatPrice", () => {
	it("strips the decimal portion when present", () => {
		expect(formatPrice("19.99")).toBe("19");
		expect(formatPrice("0.5")).toBe("0");
	});

	it("returns the value unchanged when there is no decimal", () => {
		expect(formatPrice("19")).toBe("19");
		expect(formatPrice("1000")).toBe("1000");
	});
});

describe("getCurrencySymbol", () => {
	it("maps currency codes to their symbol", () => {
		expect(getCurrencySymbol("USD")).toBe("$");
		expect(getCurrencySymbol("EUR")).toBe("€");
		expect(getCurrencySymbol("GBP")).toBe("£");
	});
});

describe("validateStepHelper", () => {
	describe("step 1 (basic info)", () => {
		it("flags an empty required field", () => {
			const result = validateStepHelper({
				step: 1,
				formData: { name: "", title: "Menu", currency: "EUR" },
			});
			expect(result.isValid).toBe(false);
			expect(result.errors.name).toBeTruthy();
		});

		it("passes when all default required fields are filled", () => {
			const result = validateStepHelper({
				step: 1,
				formData: { name: "Burger House", title: "Menu", currency: "EUR" },
			});
			expect(result.isValid).toBe(true);
			expect(result.errors).toEqual({});
		});

		it("only validates the fields listed in requiredFields.step1", () => {
			const result = validateStepHelper({
				step: 1,
				formData: { name: "Burger House", title: "", currency: "" },
				requiredFields: { step1: ["name"] },
			});
			expect(result.isValid).toBe(true);
		});
	});

	describe("step 2 (categories)", () => {
		it("requires at least one category", () => {
			const result = validateStepHelper({
				step: 2,
				formData: { services: [] },
			});
			expect(result.isValid).toBe(false);
			expect(result.step2Error).toMatch(/at least one/i);
		});

		it("rejects categories without a name", () => {
			const result = validateStepHelper({
				step: 2,
				formData: { services: [{ name: "" }] },
			});
			expect(result.isValid).toBe(false);
			expect(result.step2Error).toMatch(/name and layout/i);
		});

		it("rejects duplicate category names case-insensitively", () => {
			const result = validateStepHelper({
				step: 2,
				formData: { services: [{ name: "Drinks" }, { name: "drinks" }] },
			});
			expect(result.isValid).toBe(false);
			expect(result.step2Error).toMatch(/unique/i);
		});

		it("passes with distinct, named categories", () => {
			const result = validateStepHelper({
				step: 2,
				formData: { services: [{ name: "Drinks" }, { name: "Food" }] },
			});
			expect(result.isValid).toBe(true);
		});
	});

	describe("step 3 (items)", () => {
		const category = (items: unknown[], layout = "variant_1") => ({
			services: [{ name: "Drinks", layout, items }],
		});

		it("requires each category to have at least one item", () => {
			const result = validateStepHelper({ step: 3, formData: category([]) });
			expect(result.isValid).toBe(false);
			expect(result.step3Error).toMatch(/at least one service item/i);
		});

		it("rejects items without a name", () => {
			const result = validateStepHelper({
				step: 3,
				formData: category([{ name: "", price: 5, image: "img.webp" }]),
			});
			expect(result.isValid).toBe(false);
			expect(result.step3Error).toMatch(/must have a name/i);
		});

		it("rejects negative prices", () => {
			const result = validateStepHelper({
				step: 3,
				formData: category([{ name: "Cola", price: -1, image: "img.webp" }]),
			});
			expect(result.isValid).toBe(false);
			expect(result.step3Error).toMatch(/0 or greater/i);
		});

		it("requires an image for layouts other than variant_3", () => {
			const result = validateStepHelper({
				step: 3,
				formData: category(
					[{ name: "Cola", price: 5, image: "" }],
					"variant_1",
				),
			});
			expect(result.isValid).toBe(false);
			expect(result.step3Error).toMatch(/image .* is required/i);
		});

		it("does not require an image for the variant_3 layout", () => {
			const result = validateStepHelper({
				step: 3,
				formData: category(
					[{ name: "Cola", price: 5, image: "" }],
					"variant_3",
				),
			});
			expect(result.isValid).toBe(true);
		});
	});
});

describe("getRequiredPlan", () => {
	const tiers = [
		{
			id: 1,
			type: "standard",
			features: {
				catalogues: 1,
				ai_prompts: 0,
				ocr_ai_import: 0,
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
				ai_prompts: 10,
				ocr_ai_import: 5,
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
				ai_prompts: 100,
				ocr_ai_import: 50,
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
