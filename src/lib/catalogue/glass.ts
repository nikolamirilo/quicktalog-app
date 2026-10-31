import type {
	GlassLevel,
	GlassSettings,
	GlassTarget,
} from "@quicktalog/common";

export const GLASS_TARGETS: { key: GlassTarget; label: string }[] = [
	{ key: "navbar", label: "Navbar" },
	{ key: "search", label: "Search bar" },
	{ key: "headers", label: "Section headers" },
	{ key: "cards", label: "Item cards" },
];

/** Glass Effect Spec presets, indexed by `GlassSettings.level`. */
export const GLASS_PRESETS = [
	{ label: "Off", frost: 0, splay: 0, opacity: 100, saturate: 100 },
	{ label: "Clear", frost: 2, splay: 4, opacity: 35, saturate: 120 },
	{ label: "Semi-frosted", frost: 8, splay: 8, opacity: 55, saturate: 140 },
	{ label: "Frosted", frost: 20, splay: 12, opacity: 70, saturate: 160 },
] as const;

export const GLASS_LIMITS = {
	opacity: { min: 20, max: 85 },
	frost: { min: 0, max: 40 },
	splay: { min: 0, max: 24 },
} as const;

export const DEFAULT_GLASS: GlassSettings = {
	level: 0,
	opacity: null,
	frost: null,
	splay: null,
	apply: { navbar: true, search: true, headers: true, cards: true },
};

const clamp = (value: number, min: number, max: number) =>
	Math.min(max, Math.max(min, Math.round(value)));

const override = (
	value: unknown,
	limits: { min: number; max: number },
): number | null =>
	typeof value === "number" && Number.isFinite(value)
		? clamp(value, limits.min, limits.max)
		: null;

/** Fills gaps and clamps every number, so stored data is always renderable. */
export function normalizeGlass(glass: unknown): GlassSettings {
	if (!glass || typeof glass !== "object") return DEFAULT_GLASS;
	const raw = glass as Partial<GlassSettings>;
	const level = (
		[0, 1, 2, 3].includes(raw.level as number) ? raw.level : 0
	) as GlassLevel;
	const apply = (raw.apply ?? {}) as Partial<GlassSettings["apply"]>;
	return {
		level,
		opacity: override(raw.opacity, GLASS_LIMITS.opacity),
		frost: override(raw.frost, GLASS_LIMITS.frost),
		splay: override(raw.splay, GLASS_LIMITS.splay),
		apply: {
			navbar: apply.navbar !== false,
			search: apply.search !== false,
			headers: apply.headers !== false,
			cards: apply.cards !== false,
		},
	};
}

/** The values in effect: the level's preset unless the owner fine-tuned it. */
export function resolveGlass(glass: GlassSettings | undefined) {
	const g = normalizeGlass(glass);
	const preset = GLASS_PRESETS[g.level];
	const on = g.level > 0;
	return {
		on,
		preset,
		opacity: on ? (g.opacity ?? preset.opacity) : 100,
		frost: on ? (g.frost ?? preset.frost) : 0,
		splay: on ? (g.splay ?? preset.splay) : 0,
		tuned: on && (g.opacity != null || g.frost != null || g.splay != null),
		apply: g.apply,
	};
}

/** CSS variables for `.catalogue-root`; `styles/catalogue-chrome.css` reads them. */
export function glassStyle(
	glass: GlassSettings | undefined,
	isDark: boolean,
): Record<string, string> {
	const g = resolveGlass(glass);
	return {
		"--glass-frost": `${g.frost}px`,
		"--glass-splay": `${g.splay}px`,
		"--glass-tint": String(g.opacity / 100),
		"--glass-tint-pct": `${g.opacity}%`,
		"--glass-saturate": `${g.preset.saturate}%`,
		// Dark themes get a quarter of the sheen, or it reads as fog.
		"--glass-sheen-a": (g.splay * 0.03 * (isDark ? 0.25 : 1)).toFixed(3),
	};
}

/** `data-glass-*` attributes for `.catalogue-root`, one per surface in glass. */
export function glassAttributes(
	glass: GlassSettings | undefined,
): Record<string, "" | undefined> {
	const g = resolveGlass(glass);
	return Object.fromEntries(
		GLASS_TARGETS.map(({ key }) => [
			`data-glass-${key}`,
			g.on && g.apply[key] ? "" : undefined,
		]),
	);
}
