import {
	DEFAULT_THEME_KEY,
	THEME_COLOR_TOKENS,
	THEME_KEYS,
	THEMES,
} from "@/constants/themes";
import { isDarkColor, normalizeHexColor } from "@/helpers/color";
import type {
	ResolvedTheme,
	StoredTheme,
	ThemeColors,
	ThemeColorToken,
	ThemeKey,
	ThemeOverrides,
} from "@/types/theme";

export const isThemeKey = (value: unknown): value is ThemeKey =>
	typeof value === "string" &&
	(THEME_KEYS as readonly string[]).includes(value);

export const themeColorCssVar = (token: ThemeColorToken): string =>
	`--catalogue-${token.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`)}`;

export const sanitizeThemeOverrides = (value: unknown): ThemeOverrides => {
	if (!value || typeof value !== "object") return {};
	const source = value as Record<string, unknown>;
	const overrides: ThemeOverrides = {};
	for (const token of THEME_COLOR_TOKENS) {
		const color = normalizeHexColor(source[token]);
		if (color) overrides[token] = color;
	}
	return overrides;
};

export const resolveTheme = (stored: StoredTheme): ResolvedTheme => {
	const name = stored?.name;
	const key = isThemeKey(name) ? name : DEFAULT_THEME_KEY;
	const base = THEMES[key];
	const overrides = sanitizeThemeOverrides(stored?.colors);
	const colors: ThemeColors = { ...base.colors, ...overrides };

	return {
		key,
		colors,
		overrides,
		isCustom: Object.keys(overrides).length > 0,
		categoryGradient: base.categoryGradient,
		categoryShadow: base.categoryShadow,
		typography: base.typography,
		// The pattern is painted over the background, so it would hide a customized one.
		decoration: base.decoration && overrides.background === undefined,
		pageIsDark: isDarkColor(colors.background),
		navigationIsDark: isDarkColor(colors.navigationBackground),
	};
};
