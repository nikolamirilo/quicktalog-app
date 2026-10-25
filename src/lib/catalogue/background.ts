import type {
	CatalogueBackground,
	CatalogueBackgroundType,
} from "@quicktalog/common";
import { isDarkBackground } from "@/lib/themes/custom-theme";

const mesh = (base: string, a: string, b: string, c: string) =>
	`radial-gradient(60% 55% at 12% 8%, ${a} 0, transparent 70%), radial-gradient(55% 50% at 88% 30%, ${b} 0, transparent 70%), radial-gradient(75% 60% at 40% 100%, ${c} 0, transparent 72%), ${base}`;

/**
 * Soft mesh gradients; `dark: true` means text on top should be light.
 * Two presets never share a hue unless their saturation differs sharply, or
 * they read as the same wash in the picker.
 */
export const BACKGROUND_GRADIENTS = [
	{
		key: "oat",
		name: "Oat milk",
		dark: false,
		css: mesh("#f6efe4", "#f0d3a6", "#e8c3a0", "#fbf3e6"),
	},
	{
		key: "peach",
		name: "Peach glow",
		dark: false,
		css: mesh("#fde9dd", "#ffc29f", "#ffd6c0", "#f8b49c"),
	},
	{
		key: "sunset",
		name: "Sunset",
		dark: false,
		css: "linear-gradient(160deg, #ffe0b8 0%, #ffbfb0 48%, #d9c6ff 100%)",
	},
	{
		key: "sage",
		name: "Sage",
		dark: false,
		css: mesh("#eef2e6", "#c9d9ae", "#e0e9cc", "#b3c79a"),
	},
	{
		key: "meadow",
		name: "Meadow",
		dark: false,
		css: mesh("#edf7ec", "#b4e2b0", "#d7eed3", "#98d49a"),
	},
	{
		key: "seaglass",
		name: "Sea glass",
		dark: false,
		css: mesh("#e6f4f1", "#afddd2", "#d1ede6", "#98d0c3"),
	},
	{
		key: "sky",
		name: "Morning sky",
		dark: false,
		css: mesh("#eaf3fb", "#b6d8f4", "#d6eafa", "#a3c8ef"),
	},
	{
		key: "lavender",
		name: "Lavender",
		dark: false,
		css: mesh("#f2eef9", "#d5c6f0", "#e8e0f7", "#c4b2e9"),
	},
	{
		key: "orchid",
		name: "Orchid",
		dark: false,
		css: mesh("#f8eef7", "#e6c2e4", "#f0dcef", "#d8a9d6"),
	},
	{
		key: "blush",
		name: "Blush",
		dark: false,
		css: mesh("#fcedf0", "#f4c1cd", "#fadbe2", "#ecadbd"),
	},
	{
		key: "stone",
		name: "Stone",
		dark: false,
		css: mesh("#f4f1ec", "#ddd5c8", "#eae5db", "#cdc3b2"),
	},
	{
		key: "mist",
		name: "Mist",
		dark: false,
		css: mesh("#eef1f4", "#ccd6e0", "#dfe6ec", "#b9c7d4"),
	},
] as const;

export const BACKGROUND_COLORS = [
	"#ffffff",
	"#f6f1e9",
	"#f3ece2",
	"#eef2e6",
	"#eaf3fb",
	"#fcedf0",
	"#f2eef9",
	"#fdf8e1",
	"#1f1712",
	"#0f1424",
	"#0f1a14",
	"#1a1020",
];

export const BACKGROUND_FADE = { min: 0, max: 80 } as const;

export const DEFAULT_BACKGROUND: CatalogueBackground = {
	isEnabled: false,
	type: "gradient",
	gradient: "oat",
	color: "#f6f1e9",
	image: null,
	fade: 35,
};

const TYPES: CatalogueBackgroundType[] = ["image", "gradient", "color"];
const HEX = /^#[0-9a-f]{6}$/i;

const gradientFor = (key: string) =>
	BACKGROUND_GRADIENTS.find((g) => g.key === key) ?? BACKGROUND_GRADIENTS[0];

/** Only absolute http(s) URLs; quotes and newlines would end `url("...")`. */
function safeImageUrl(value: unknown): string | null {
	if (typeof value !== "string" || /["'\\\n\r]/.test(value)) return null;
	try {
		const url = new URL(value);
		return url.protocol === "https:" || url.protocol === "http:"
			? url.toString()
			: null;
	} catch {
		return null;
	}
}

/** Fills gaps and drops anything unsafe, so stored data is always renderable. */
export function normalizeBackground(background: unknown): CatalogueBackground {
	if (!background || typeof background !== "object") return DEFAULT_BACKGROUND;
	const raw = background as Partial<CatalogueBackground>;
	const fade = Number(raw.fade);
	return {
		isEnabled: raw.isEnabled === true,
		type: TYPES.includes(raw.type as CatalogueBackgroundType)
			? (raw.type as CatalogueBackgroundType)
			: DEFAULT_BACKGROUND.type,
		gradient: gradientFor(String(raw.gradient)).key,
		color: HEX.test(String(raw.color))
			? String(raw.color).toLowerCase()
			: DEFAULT_BACKGROUND.color,
		image: safeImageUrl(raw.image),
		fade: Number.isFinite(fade)
			? Math.min(
					BACKGROUND_FADE.max,
					Math.max(BACKGROUND_FADE.min, Math.round(fade)),
				)
			: DEFAULT_BACKGROUND.fade,
	};
}

/**
 * Style of the fixed layer that replaces the theme background, or null when
 * the theme background shows (off, or a photo type without a photo yet).
 */
export function backgroundLayerStyle(
	background: CatalogueBackground | undefined,
): Record<string, string> | null {
	const bg = normalizeBackground(background);
	if (!bg.isEnabled) return null;
	if (bg.type === "image")
		return bg.image ? { backgroundImage: `url("${bg.image}")` } : null;
	if (bg.type === "color") return { background: bg.color };
	return { background: gradientFor(bg.gradient).css };
}

/** Whether light text suits the background; null for photos, whose fade uses the theme colour. */
export function backgroundIsDark(
	background: CatalogueBackground | undefined,
): boolean | null {
	const bg = normalizeBackground(background);
	if (bg.type === "image") return null;
	if (bg.type === "color") return isDarkBackground(bg.color);
	return gradientFor(bg.gradient).dark;
}
