import { describe, expect, it } from "vitest";
import { calculateDimensions } from "@/helpers/imageProcessing";

describe("calculateDimensions", () => {
	it("leaves dimensions untouched when both are within the max", () => {
		expect(calculateDimensions(800, 600, 1000)).toEqual({
			width: 800,
			height: 600,
		});
	});

	it("leaves dimensions untouched when exactly at the max", () => {
		expect(calculateDimensions(1000, 1000, 1000)).toEqual({
			width: 1000,
			height: 1000,
		});
	});

	it("clamps a landscape image to the max width and preserves the ratio", () => {
		expect(calculateDimensions(2000, 1000, 1000)).toEqual({
			width: 1000,
			height: 500,
		});
	});

	it("clamps a portrait image to the max height and preserves the ratio", () => {
		expect(calculateDimensions(1000, 2000, 1000)).toEqual({
			width: 500,
			height: 1000,
		});
	});

	it("clamps a square image on both axes", () => {
		expect(calculateDimensions(2000, 2000, 1000)).toEqual({
			width: 1000,
			height: 1000,
		});
	});
});
