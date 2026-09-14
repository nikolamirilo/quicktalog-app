import type { THEME_COLOR_TOKENS, THEME_KEYS } from "@/constants/themes";

export type ThemeKey = (typeof THEME_KEYS)[number];

export type ThemeColorToken = (typeof THEME_COLOR_TOKENS)[number];

export type ThemeColors = Record<ThemeColorToken, string>;

export type ThemeOverrides = Partial<ThemeColors>;

export type ThemeTypography = {
	fontHeading: string;
	fontBody: string;
	weightHeading: string;
	weightBody: string;
	spacingHeading: string;
};

export type ThemeDefinition = {
	label: string;
	// Still renders for catalogues that already use it, but the picker doesn't offer it.
	hidden: boolean;
	// Paints a background-image pattern on top of the page background.
	decoration: boolean;
	colors: ThemeColors;
	categoryGradient: readonly [from: string, to: string];
	categoryShadow: string;
	typography?: ThemeTypography;
};

export type StoredTheme =
	| { name?: unknown; colors?: unknown }
	| null
	| undefined;

export type ResolvedTheme = {
	key: ThemeKey;
	colors: ThemeColors;
	overrides: ThemeOverrides;
	isCustom: boolean;
	categoryGradient: readonly [from: string, to: string];
	categoryShadow: string;
	typography?: ThemeTypography;
	decoration: boolean;
	pageIsDark: boolean;
	navigationIsDark: boolean;
};
