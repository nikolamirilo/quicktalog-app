import type { CustomThemeColors } from "@quicktalog/common";

/**
 * Derivation of a full `--catalogue-*` palette from the six colours an owner
 * picks in the builder. Pure and dependency-free so it can run on the server
 * (where the <style> block is rendered) and in the client picker alike.
 */

/** Used whenever the owner has not picked a colour yet. Mirrors theme-monochrome. */
export const DEFAULT_CUSTOM_COLORS: Required<CustomThemeColors> = {
	background: "#f3f3f3",
	heading: "#000000",
	text: "#1a1a1a",
	primary: "#000000",
	secondary: "#4d4d4d",
	cardBackground: "#ffffff",
};

export const CUSTOM_THEME_NAME = "theme-custom";

/** The six keys an owner controls. Everything else is derived from these. */
export const CUSTOM_COLOR_KEYS = [
	"background",
	"heading",
	"text",
	"primary",
	"secondary",
	"cardBackground",
] as const satisfies readonly (keyof CustomThemeColors)[];

const HEX = /^#[0-9a-fA-F]{6}$/;
const HEX_SHORT = /^#[0-9a-fA-F]{3}$/;

const isHexColor = (value: unknown): value is string =>
	typeof value === "string" && HEX.test(value);

/**
 * Expands `#rgb` to `#rrggbb`, passes a valid six-digit hex through, rejects
 * the rest. Matters at the boundary where colours are read from outside
 * (`getComputedStyle`, stored JSON) - a minifier can shorten a repeated-digit
 * hex to three digits, and the rest of this module assumes six.
 */
const normalizeHexColor = (value: unknown): string | undefined => {
	if (typeof value !== "string") return undefined;
	const trimmed = value.trim();
	if (HEX.test(trimmed)) return trimmed.toLowerCase();
	if (HEX_SHORT.test(trimmed)) {
		const [r, g, b] = trimmed.slice(1).toLowerCase();
		return `#${r}${r}${g}${g}${b}${b}`;
	}
	return undefined;
};

/** Whether two palettes hold the same six colours, so a saved theme tile can tell it's the active selection. */
export const customThemeColorsEqual = (
	a: CustomThemeColors | undefined,
	b: CustomThemeColors | undefined,
): boolean =>
	CUSTOM_COLOR_KEYS.every((key) => (a?.[key] ?? "") === (b?.[key] ?? ""));

const hexToRgb = (hex: string): { r: number; g: number; b: number } => {
	const safe = isHexColor(hex) ? hex : "#000000";
	return {
		r: parseInt(safe.slice(1, 3), 16),
		g: parseInt(safe.slice(3, 5), 16),
		b: parseInt(safe.slice(5, 7), 16),
	};
};

const toHex = (n: number) =>
	Math.max(0, Math.min(255, Math.round(n)))
		.toString(16)
		.padStart(2, "0");

const rgbToHex = (r: number, g: number, b: number) =>
	`#${toHex(r)}${toHex(g)}${toHex(b)}`;

/** Linear blend of `a` towards `b`; `t` is how much of `b` lands in the result. */
const mix = (a: string, b: string, t: number): string => {
	const ratio = Math.max(0, Math.min(1, t));
	const from = hexToRgb(a);
	const to = hexToRgb(b);
	return rgbToHex(
		from.r + (to.r - from.r) * ratio,
		from.g + (to.g - from.g) * ratio,
		from.b + (to.b - from.b) * ratio,
	);
};

/** WCAG 2.x relative luminance. */
const luminance = (hex: string): number => {
	const { r, g, b } = hexToRgb(hex);
	const channel = (value: number) => {
		const c = value / 255;
		return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
	};
	return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
};

/** WCAG contrast ratio, 1 (identical) to 21 (black on white). */
const contrastRatio = (a: string, b: string): number => {
	const la = luminance(a);
	const lb = luminance(b);
	const lighter = Math.max(la, lb);
	const darker = Math.min(la, lb);
	return (lighter + 0.05) / (darker + 0.05);
};

/**
 * The legible foreground to lay over `background`. A plain "higher contrast
 * wins" comparison flips to black on the slightest margin for a saturated
 * mid-brightness colour (a typical brand "Primary"), which reads as a bug on
 * text expected to stay white - so black only wins by a clear margin.
 */
const BLACK_CONTRAST_MARGIN = 1.15;
const onColor = (background: string): string =>
	contrastRatio("#111111", background) >
	contrastRatio("#ffffff", background) * BLACK_CONTRAST_MARGIN
		? "#111111"
		: "#ffffff";

/** Nudges `foreground` toward the on-colour of `background` until it clears WCAG AA. */
const ensureContrast = (
	foreground: string,
	background: string,
	target = 4.5,
): string => {
	const anchor = onColor(background);
	let result = isHexColor(foreground) ? foreground : anchor;
	for (let step = 0; step < 20; step++) {
		if (contrastRatio(result, background) >= target) break;
		result = mix(result, anchor, 0.05);
	}
	return result;
};

/** A background counts as dark when white is the legible colour to put on it. */
export const isDarkBackground = (hex: string | undefined): boolean =>
	onColor(isHexColor(hex) ? hex : DEFAULT_CUSTOM_COLORS.background) ===
	"#ffffff";

/** Drops anything that is not one of the six keys holding a `#rrggbb` value. */
export const sanitizeCustomThemeColors = (
	colors: unknown,
): CustomThemeColors => {
	if (!colors || typeof colors !== "object") return {};
	const source = colors as Record<string, unknown>;
	const clean: CustomThemeColors = {};
	for (const key of CUSTOM_COLOR_KEYS) {
		const normalized = normalizeHexColor(source[key]);
		if (normalized) clean[key] = normalized;
	}
	return clean;
};

/**
 * The full `--catalogue-*` map for a custom theme.
 *
 * `--catalogue-category-shadow` is deliberately absent: Catalogue.tsx already
 * sets it inline from `appearance.style.shadow`, and inline wins over a class.
 */
export const deriveCatalogueVars = (
	colors: CustomThemeColors | undefined,
): Record<string, string> => {
	const { background, heading, text, primary, secondary, cardBackground } = {
		...DEFAULT_CUSTOM_COLORS,
		...sanitizeCustomThemeColors(colors),
	};

	const onCard = onColor(cardBackground);
	const onBackground = onColor(background);
	const cardBorder = mix(cardBackground, onCard, 0.12);
	// No seventh "navigation" swatch to seed from, so nudge the card colour
	// toward the background instead of reusing it verbatim.
	const navBackground = mix(cardBackground, background, 0.2);
	const onNav = onColor(navBackground);
	const navBorder = mix(cardBorder, background, 0.2);

	return {
		"--catalogue-background": background,
		"--catalogue-foreground": heading,
		"--catalogue-heading": heading,
		"--catalogue-text": text,

		"--catalogue-primary": primary,
		"--catalogue-secondary": secondary,
		"--catalogue-primary-foreground": onColor(primary),
		"--catalogue-secondary-foreground": onColor(secondary),
		"--catalogue-button-text": onColor(primary),
		"--catalogue-accent": mix(cardBackground, primary, 0.15),
		"--catalogue-price": ensureContrast(primary, cardBackground),

		"--catalogue-card-background": cardBackground,
		"--catalogue-card-heading": onCard,
		"--catalogue-card-text": mix(onCard, cardBackground, 0.12),
		"--catalogue-card-description": mix(onCard, cardBackground, 0.32),
		"--catalogue-card-border": cardBorder,

		"--catalogue-section-background": mix(background, onBackground, 0.06),
		"--catalogue-section-border": mix(background, onBackground, 0.14),

		"--catalogue-navigation-background": navBackground,
		"--catalogue-navigation-text": onNav,
		"--catalogue-navigation-border": navBorder,

		"--catalogue-category-accent": primary,
		"--catalogue-category-border": primary,
		"--catalogue-category-gradient": `linear-gradient(135deg, ${cardBackground} 0%, ${mix(cardBackground, primary, 0.08)} 100%)`,
	};
};

const SAFE_VAR_NAME = /^--catalogue-[a-z-]+$/;
const SAFE_VAR_VALUE =
	/^(#[0-9a-fA-F]{6}|linear-gradient\(135deg, #[0-9a-fA-F]{6} 0%, #[0-9a-fA-F]{6} 100%\))$/;

/**
 * Renders the derived map as a `.theme-custom` rule for a <style> tag. This is
 * the security boundary between owner-supplied JSON and the document: an
 * allowlist, not a denylist, since a raw "</style>" would break out of the tag.
 */
export const serializeThemeCss = (vars: Record<string, string>): string => {
	const declarations = Object.entries(vars)
		.filter(
			([name, value]) =>
				SAFE_VAR_NAME.test(name) &&
				typeof value === "string" &&
				SAFE_VAR_VALUE.test(value),
		)
		.map(([name, value]) => `${name}: ${value};`)
		.join("");

	return declarations ? `.${CUSTOM_THEME_NAME}{${declarations}}` : "";
};

/**
 * Seeds the picker from whatever theme is currently applied, so switching to
 * Custom starts from what the owner can already see. Unregistered custom
 * properties resolve to their raw `#rrggbb` token; anything else is dropped.
 */
export const readPaletteFromElement = (
	element: Element | null,
): CustomThemeColors => {
	if (!element || typeof window === "undefined") return {};
	const computed = window.getComputedStyle(element);
	const read = (name: string) => computed.getPropertyValue(name).trim();

	return sanitizeCustomThemeColors({
		background: read("--catalogue-background"),
		heading: read("--catalogue-heading"),
		text: read("--catalogue-text"),
		primary: read("--catalogue-primary"),
		secondary: read("--catalogue-secondary"),
		cardBackground: read("--catalogue-card-background"),
	});
};
