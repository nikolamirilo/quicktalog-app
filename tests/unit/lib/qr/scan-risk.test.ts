import { describe, expect, it } from "vitest";
import { defaultQrConfig, type QrConfig } from "@/lib/qr/design";
import { assessScanRisk } from "@/lib/qr/scan-risk";

const withLogo = (
	errorCorrectionLevel: "L" | "M" | "Q" | "H",
	imageSize: number,
	showLogo = true,
): QrConfig => ({
	...defaultQrConfig("https://example.test/catalogues/a"),
	image: "https://abc.ufs.sh/f/logo",
	showLogo,
	qrOptions: { errorCorrectionLevel },
	imageOptions: { imageSize },
});

describe("assessScanRisk logo thresholds per error correction level", () => {
	// A logo is "big" when (size × 0.3)² exceeds 35% of what the level recovers.
	it.each([
		["L", 0.5, 0.55],
		["M", 0.75, 0.8],
		["Q", 0.98, 1],
	] as const)("level %s: %s is fine, %s is too big", (level, ok, big) => {
		expect(assessScanRisk(withLogo(level, ok)).bigLogo).toBe(false);
		expect(assessScanRisk(withLogo(level, big)).bigLogo).toBe(true);
	});

	it("level H never calls a logo too big within the slider's range", () => {
		expect(assessScanRisk(withLogo("H", 1)).bigLogo).toBe(false);
	});

	it("flags any logo at level L, and none when the logo is hidden", () => {
		expect(assessScanRisk(withLogo("L", 0.2)).logoAtL).toBe(true);
		const hidden = assessScanRisk(withLogo("L", 1, false));
		expect(hidden.logoAtL).toBe(false);
		expect(hidden.bigLogo).toBe(false);
	});

	it("puts the most important tip first", () => {
		expect(assessScanRisk(withLogo("L", 0.9)).tip).toMatch(/too large/);
		expect(assessScanRisk(withLogo("L", 0.2)).tip).toMatch(/M or higher/);
		expect(assessScanRisk(withLogo("Q", 0.4)).tip).toBeNull();
	});

	it("treats light dots on a dark background as low contrast", () => {
		const inverted = {
			...defaultQrConfig("x"),
			dotsOptions: { color: "#FFFFFF" },
			cornersSquareOptions: { color: "#FFFFFF" },
			cornersDotOptions: { color: "#FFFFFF" },
			backgroundOptions: { color: "#000000" },
		};
		expect(assessScanRisk(inverted).lowContrast).toBe(true);
	});
});
