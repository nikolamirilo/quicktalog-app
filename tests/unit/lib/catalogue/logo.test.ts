import { describe, expect, it } from "vitest";
import {
	catalogueLogoHref,
	catalogueLogos,
	isLogoHidden,
	LOGO_MAX_HEIGHT,
	LOGO_RADIUS_MAX,
	LOGO_SCALE,
	logoHeightFor,
	logoRadiusStyle,
	logoScaleOf,
	normalizeLogoRadius,
	normalizeLogoScale,
	withLogoScale,
} from "@/lib/catalogue/logo";

describe("catalogueLogoHref", () => {
	it("sends the default header and footer to Quicktalog, not the owner's site", () => {
		expect(
			catalogueLogoHref({ type: "default", website: "mybakery.com" }),
		).toBe("/");
		expect(
			catalogueLogoHref({ type: undefined, website: "mybakery.com" }),
		).toBe("/");
	});

	it("sends a custom header or footer to the owner's website", () => {
		expect(catalogueLogoHref({ type: "custom", website: "mybakery.com" })).toBe(
			"mybakery.com",
		);
	});

	it("links nowhere when a custom header or footer has no website", () => {
		expect(catalogueLogoHref({ type: "custom", website: "" })).toBe("");
		expect(catalogueLogoHref({ type: "custom", website: "   " })).toBe("");
		expect(catalogueLogoHref({ type: "custom", website: undefined })).toBe("");
	});
});

describe("catalogueLogos", () => {
	it("shows the owner's logo only where the layout is custom", () => {
		expect(
			catalogueLogos(
				{ logo: "own.png", headerType: "custom", footerType: "default" },
				"quicktalog.svg",
			),
		).toEqual({ header: "own.png", footer: "quicktalog.svg" });
	});
});

describe("isLogoHidden", () => {
	it("is true only for a logo neither place will show", () => {
		const types = { headerType: "default", footerType: "default" };
		expect(isLogoHidden({ logo: "own.png", ...types })).toBe(true);
		expect(isLogoHidden({ logo: "", ...types })).toBe(false);
		expect(
			isLogoHidden({ logo: "own.png", ...types, headerType: "custom" }),
		).toBe(false);
	});
});

describe("normalizeLogoScale", () => {
	it("treats a missing or unusable scale as the biggest it goes", () => {
		expect(normalizeLogoScale(undefined)).toBe(LOGO_SCALE.max);
		expect(normalizeLogoScale("80%")).toBe(LOGO_SCALE.max);
		expect(normalizeLogoScale(Number.NaN)).toBe(LOGO_SCALE.max);
	});

	it("clamps to the slider's range and rounds", () => {
		expect(normalizeLogoScale(55)).toBe(55);
		expect(normalizeLogoScale(55.4)).toBe(55);
		expect(normalizeLogoScale(0)).toBe(LOGO_SCALE.min);
		expect(normalizeLogoScale(400)).toBe(LOGO_SCALE.max);
	});
});

describe("logoScaleOf", () => {
	it("reads the stored scale, and falls back for data that predates it", () => {
		expect(logoScaleOf({ logoScale: 40 })).toBe(40);
		expect(logoScaleOf({ logoSize: { width: 160 } })).toBe(LOGO_SCALE.max);
		expect(logoScaleOf(undefined)).toBe(LOGO_SCALE.max);
	});
});

describe("withLogoScale", () => {
	it("sets a clamped scale and leaves the rest alone", () => {
		expect(withLogoScale({ type: "custom" }, 240)).toEqual({
			type: "custom",
			logoScale: LOGO_SCALE.max,
		});
		expect(withLogoScale({ type: "custom" }, 30)).toEqual({
			type: "custom",
			logoScale: 30,
		});
	});
});

describe("logoHeightFor", () => {
	it("gives each place its own full size at 100%", () => {
		expect(logoHeightFor("header", 100)).toBe(LOGO_MAX_HEIGHT.header);
		expect(logoHeightFor("footer", 100)).toBe(LOGO_MAX_HEIGHT.footer);
	});

	it("scales down from there", () => {
		expect(logoHeightFor("header", 50)).toBe(28);
		expect(logoHeightFor("footer", 50)).toBe(36);
	});

	it("never draws past the place's limit", () => {
		expect(logoHeightFor("header", 500)).toBe(LOGO_MAX_HEIGHT.header);
	});
});

describe("logoRadiusStyle", () => {
	it("leaves a square logo without a radius", () => {
		expect(logoRadiusStyle(0)).toBeUndefined();
		expect(logoRadiusStyle(undefined)).toBeUndefined();
	});

	it("reads as a share of fully round, so 100% is a circle", () => {
		expect(logoRadiusStyle(LOGO_RADIUS_MAX)).toBe("50%");
		expect(logoRadiusStyle(50)).toBe("25%");
		expect(logoRadiusStyle(999)).toBe("50%");
	});
});

describe("normalizeLogoRadius", () => {
	it("keeps a value in range and rounds it", () => {
		expect(normalizeLogoRadius(25)).toBe(25);
		expect(normalizeLogoRadius(12.6)).toBe(13);
	});

	it("falls back to square for anything unusable", () => {
		expect(normalizeLogoRadius(-5)).toBe(0);
		expect(normalizeLogoRadius("50%")).toBe(0);
		expect(normalizeLogoRadius(Number.NaN)).toBe(0);
		expect(normalizeLogoRadius(undefined)).toBe(0);
	});

	it("clamps above fully round", () => {
		expect(normalizeLogoRadius(140)).toBe(LOGO_RADIUS_MAX);
		expect(normalizeLogoRadius(80)).toBe(80);
	});
});
