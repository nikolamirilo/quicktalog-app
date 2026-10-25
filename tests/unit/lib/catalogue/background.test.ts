import { describe, expect, it } from "vitest";
import {
	BACKGROUND_GRADIENTS,
	DEFAULT_BACKGROUND,
	backgroundIsDark,
	backgroundLayerStyle,
	normalizeBackground,
} from "@/lib/catalogue/background";

describe("normalizeBackground", () => {
	it("falls back to the default for missing or malformed input", () => {
		expect(normalizeBackground(undefined)).toEqual(DEFAULT_BACKGROUND);
		expect(normalizeBackground("oat")).toEqual(DEFAULT_BACKGROUND);
	});

	it("drops unknown gradients, bad colours and out-of-range fades", () => {
		const bg = normalizeBackground({
			isEnabled: true,
			type: "video",
			gradient: "neon",
			color: "red",
			fade: 300,
		});
		expect(bg).toMatchObject({
			isEnabled: true,
			type: "gradient",
			gradient: "oat",
			color: DEFAULT_BACKGROUND.color,
			fade: 80,
		});
	});

	it("keeps only http(s) photo URLs without characters that end url()", () => {
		const ok = "https://utfs.io/f/abc.jpg";
		expect(normalizeBackground({ image: ok }).image).toBe(ok);
		expect(
			normalizeBackground({ image: "javascript:alert(1)" }).image,
		).toBeNull();
		expect(
			normalizeBackground({
				image: 'https://x.io/a.jpg"), url("https://evil.io',
			}).image,
		).toBeNull();
	});
});

describe("backgroundLayerStyle", () => {
	it("is null when off, or a photo type without a photo", () => {
		expect(backgroundLayerStyle(DEFAULT_BACKGROUND)).toBeNull();
		expect(
			backgroundLayerStyle({
				...DEFAULT_BACKGROUND,
				isEnabled: true,
				type: "image",
			}),
		).toBeNull();
	});

	it("paints the chosen gradient, colour or photo", () => {
		const on = { ...DEFAULT_BACKGROUND, isEnabled: true };
		expect(
			backgroundLayerStyle({ ...on, gradient: "midnight" })?.background,
		).toBe(BACKGROUND_GRADIENTS.find((g) => g.key === "midnight")?.css);
		expect(
			backgroundLayerStyle({ ...on, type: "color", color: "#0f1424" }),
		).toEqual({
			background: "#0f1424",
		});
		expect(
			backgroundLayerStyle({
				...on,
				type: "image",
				image: "https://utfs.io/f/a.jpg",
			}),
		).toEqual({ backgroundImage: 'url("https://utfs.io/f/a.jpg")' });
	});
});

describe("backgroundIsDark", () => {
	it("reads gradients and colours, and leaves photos undecided", () => {
		expect(
			backgroundIsDark({ ...DEFAULT_BACKGROUND, gradient: "midnight" }),
		).toBe(true);
		expect(backgroundIsDark({ ...DEFAULT_BACKGROUND, gradient: "oat" })).toBe(
			false,
		);
		expect(
			backgroundIsDark({
				...DEFAULT_BACKGROUND,
				type: "color",
				color: "#ffffff",
			}),
		).toBe(false);
		expect(
			backgroundIsDark({ ...DEFAULT_BACKGROUND, type: "image" }),
		).toBeNull();
	});
});
