import { readFileSync } from "node:fs";
import { join } from "node:path";
import { THEME_COLOR_TOKENS, THEME_KEYS, THEMES } from "@/constants/themes";
import {
	resolveTheme,
	sanitizeThemeOverrides,
	themeColorCssVar,
} from "@/helpers/catalogueTheme";
import type { ThemeTypography } from "@/types/theme";
import { type Appearance, themes as pickerThemes } from "@quicktalog/common";
import { describe, expect, it } from "vitest";

const TYPOGRAPHY_VARS: Record<keyof ThemeTypography, string> = {
	fontHeading: "--catalogue-font-heading",
	fontBody: "--catalogue-font-body",
	weightHeading: "--catalogue-weight-heading",
	weightBody: "--catalogue-weight-body",
	spacingHeading: "--catalogue-spacing-heading",
};

// Parsed independently of the generator so the data is checked against what renders today.
const parseLegacyStylesheet = () => {
	const css = readFileSync(
		join(process.cwd(), "styles/themes.css"),
		"utf8",
	).replace(/\/\*[\s\S]*?\*\//g, "");
	const blocks = new Map<
		string,
		{ vars: Record<string, string>; hasDecoration: boolean }
	>();
	for (const match of css.matchAll(/^\.(theme-[\w-]+)\s*\{([\s\S]*?)^\}/gm)) {
		const vars: Record<string, string> = {};
		let hasDecoration = false;
		for (const declaration of match[2].split(";")) {
			const trimmed = declaration.trim();
			if (!trimmed) continue;
			const colon = trimmed.indexOf(":");
			const property = trimmed.slice(0, colon).trim();
			const value = trimmed
				.slice(colon + 1)
				.replace(/\s+/g, " ")
				.trim();
			if (property.startsWith("--")) vars[property] = value;
			else hasDecoration = true;
		}
		blocks.set(match[1], { vars, hasDecoration });
	}
	return blocks;
};

describe("theme data matches the legacy stylesheet", () => {
	const legacy = parseLegacyStylesheet();

	it("defines exactly the themes the stylesheet defines", () => {
		expect([...THEME_KEYS].sort()).toEqual([...legacy.keys()].sort());
	});

	it.each(THEME_KEYS)("%s keeps every value", (key) => {
		const block = legacy.get(key);
		if (!block) throw new Error(`${key} is missing from styles/themes.css`);
		const { vars, hasDecoration } = block;
		const theme = THEMES[key];
		const accounted = new Set<string>();

		for (const token of THEME_COLOR_TOKENS) {
			const cssVar = themeColorCssVar(token);
			expect(theme.colors[token], cssVar).toBe(vars[cssVar]?.toLowerCase());
			accounted.add(cssVar);
		}

		const [from, to] = theme.categoryGradient;
		expect(vars["--catalogue-category-gradient"]).toMatch(
			new RegExp(
				`^linear-gradient\\( ?135deg, ${from} 0%, ${to} 100% ?\\)$`,
				"i",
			),
		);
		expect(theme.categoryShadow).toBe(vars["--catalogue-category-shadow"]);
		accounted.add("--catalogue-category-gradient");
		accounted.add("--catalogue-category-shadow");

		if (theme.typography) {
			for (const [field, cssVar] of Object.entries(TYPOGRAPHY_VARS)) {
				expect(theme.typography[field as keyof ThemeTypography], cssVar).toBe(
					vars[cssVar],
				);
				accounted.add(cssVar);
			}
		}

		expect(theme.decoration).toBe(hasDecoration);
		expect(Object.keys(vars).sort()).toEqual([...accounted].sort());
	});
});

describe("theme metadata", () => {
	it("offers the same themes, in the same order and with the same labels, as today's picker", () => {
		const visible = THEME_KEYS.filter((key) => !THEMES[key].hidden);
		const current = [...pickerThemes].sort((a, b) => a.id - b.id);
		expect(visible).toEqual(current.map((theme) => theme.key));
		expect(visible.map((key) => THEMES[key].label)).toEqual(
			current.map((theme) => theme.label),
		);
	});

	it("derives page darkness that agrees with the hand-maintained light/dark flag", () => {
		for (const { key, type } of pickerThemes) {
			expect(resolveTheme({ name: key }).pageIsDark, key).toBe(type === "dark");
		}
	});

	it("judges the navigation surface separately from the page", () => {
		const advent = resolveTheme({ name: "theme-advent-1" });
		expect(advent.pageIsDark).toBe(true);
		expect(advent.navigationIsDark).toBe(false);
	});
});

describe("resolveTheme", () => {
	it.each(THEME_KEYS)(
		"%s resolves to its exact colors when nothing is customized",
		(key) => {
			const resolved = resolveTheme({ name: key });
			expect(resolved.key).toBe(key);
			expect(resolved.colors).toEqual(THEMES[key].colors);
			expect(resolved.isCustom).toBe(false);
			expect(resolveTheme({ name: key, colors: {} })).toEqual(resolved);
		},
	);

	it("reads the stored shape existing catalogues already have", () => {
		const stored: Appearance["theme"] = {
			type: "standard",
			name: "theme-organic",
		};
		expect(resolveTheme(stored)).toEqual(
			resolveTheme({ name: "theme-organic" }),
		);
	});

	it("falls back to the default theme for missing, unknown or legacy custom names", () => {
		expect(resolveTheme(undefined).key).toBe("theme-monochrome");
		expect(resolveTheme({ name: "theme-does-not-exist" }).key).toBe(
			"theme-monochrome",
		);

		const legacyCustom: Appearance["theme"] = {
			type: "custom",
			name: "theme-custom",
			colors: { primary: "#FFF" },
		};
		const resolved = resolveTheme(legacyCustom);
		expect(resolved.key).toBe("theme-monochrome");
		expect(resolved.colors.primary).toBe("#ffffff");
		expect(resolved.isCustom).toBe(true);
	});

	it("applies overrides on top of the base and leaves every other token untouched", () => {
		const resolved = resolveTheme({
			name: "theme-organic",
			colors: { primary: "#123456" },
		});
		expect(resolved.colors).toEqual({
			...THEMES["theme-organic"].colors,
			primary: "#123456",
		});
		expect(resolved.overrides).toEqual({ primary: "#123456" });
		expect(resolved.isCustom).toBe(true);
	});

	it("drops the decoration only once the background is customized", () => {
		expect(resolveTheme({ name: "theme-coffee" }).decoration).toBe(true);
		expect(
			resolveTheme({ name: "theme-coffee", colors: { primary: "#123456" } })
				.decoration,
		).toBe(true);
		expect(
			resolveTheme({ name: "theme-coffee", colors: { background: "#123456" } })
				.decoration,
		).toBe(false);
	});
});

describe("sanitizeThemeOverrides", () => {
	it("keeps only known tokens holding valid hex colors", () => {
		expect(
			sanitizeThemeOverrides({
				primary: "#ABC",
				cardBackground: " #123456 ",
				heading: "red",
				text: "#12345",
				navigationBackground: "#fff;}body{display:none}",
				notAToken: "#000000",
			}),
		).toEqual({ primary: "#aabbcc", cardBackground: "#123456" });
	});

	it.each([null, undefined, "theme", 42, []])(
		"returns no overrides for %s",
		(value) => {
			expect(sanitizeThemeOverrides(value)).toEqual({});
		},
	);
});
