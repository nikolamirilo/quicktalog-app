import type { ErrorCorrectionLevel } from "qr-code-styling";
import { colorsOf, HEX_COLOR, type QrConfig } from "@/lib/qr/design";

/** Share of the code each error correction level can lose and still scan. */
const EC_CAPACITY: Record<ErrorCorrectionLevel, number> = {
	L: 0.07,
	M: 0.15,
	Q: 0.25,
	H: 0.3,
};

/** WCAG relative luminance of a `#RRGGBB` colour (invalid input reads as black). */
export function luminance(hex: string): number {
	if (!HEX_COLOR.test(hex)) return 0;
	const [r, g, b] = [1, 3, 5].map((i) => {
		const v = Number.parseInt(hex.slice(i, i + 2), 16) / 255;
		return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
	});
	return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** WCAG contrast ratio between two colours, 1 to 21. */
export function contrastRatio(a: string, b: string): number {
	const x = luminance(a);
	const y = luminance(b);
	return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
}

export type ScanRisk = {
	/** The weaker of dots and corner frames against the background. */
	ratio: number;
	/** Colours alone make the code hard to read. */
	lowContrast: boolean;
	/** The logo covers too much of what the error correction can recover. */
	bigLogo: boolean;
	/** A logo at level L leaves almost no room for error. */
	logoAtL: boolean;
	/** Light corner dots are the most common reason a styled code fails. */
	cornerDotsLow: boolean;
	scannable: boolean;
	/** One short fix to show under the preview, most important first. */
	tip: string | null;
};

/**
 * The editor's scan check. Thresholds come from the redesign prototype, which
 * tuned them with decode sweeps: light corner dots, any logo at level L and
 * big logos are the failure modes. It is a warning, never a block.
 */
export function assessScanRisk(config: QrConfig): ScanRisk {
	const c = colorsOf(config);
	const level = config.qrOptions?.errorCorrectionLevel ?? "Q";
	const hasLogo = Boolean(config.image) && config.showLogo !== false;
	const logoSize = config.imageOptions?.imageSize ?? 0.4;

	const capacity = EC_CAPACITY[level] ?? EC_CAPACITY.Q;
	const logoArea = hasLogo ? (logoSize * 0.3) ** 2 : 0;
	const bigLogo = logoArea > capacity * 0.35;
	const logoAtL = hasLogo && level === "L";
	const cornerDotsLow = contrastRatio(c.cornerDots, c.background) < 3;

	const ratio = Math.min(
		contrastRatio(c.dots, c.background),
		contrastRatio(c.cornerFrames, c.background),
	);
	const lowContrast =
		ratio < 3 ||
		contrastRatio(c.cornerDots, c.background) < 1.6 ||
		luminance(c.dots) > luminance(c.background);

	const tip = bigLogo
		? "Logo may be too large for this correction level"
		: logoAtL
			? "Use error correction M or higher with a logo"
			: cornerDotsLow
				? "Darker corner dots scan more reliably"
				: null;

	return {
		ratio,
		lowContrast,
		bigLogo,
		logoAtL,
		cornerDotsLow,
		scannable: !(lowContrast || bigLogo || logoAtL || cornerDotsLow),
		tip,
	};
}
