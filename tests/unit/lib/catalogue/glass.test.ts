import { describe, expect, it } from "vitest";
import {
	DEFAULT_GLASS,
	glassAttributes,
	glassStyle,
	normalizeGlass,
	resolveGlass,
} from "@/lib/catalogue/glass";

describe("normalizeGlass", () => {
	it("falls back to off for missing or malformed input", () => {
		expect(normalizeGlass(undefined)).toEqual(DEFAULT_GLASS);
		expect(normalizeGlass("frosted")).toEqual(DEFAULT_GLASS);
		expect(normalizeGlass({ level: 7 }).level).toBe(0);
	});

	it("clamps overrides and drops non-numbers", () => {
		const g = normalizeGlass({
			level: 2,
			opacity: 5,
			frost: 999,
			splay: "12px",
			apply: { cards: false },
		});
		expect(g.opacity).toBe(20);
		expect(g.frost).toBe(40);
		expect(g.splay).toBeNull();
		expect(g.apply).toEqual({
			navbar: true,
			search: true,
			headers: true,
			cards: false,
		});
	});
});

describe("resolveGlass", () => {
	it("uses the level preset unless tuned", () => {
		const g = resolveGlass({ ...DEFAULT_GLASS, level: 3 });
		expect(g).toMatchObject({ on: true, opacity: 70, frost: 20, splay: 12 });
		expect(g.tuned).toBe(false);
		const tuned = resolveGlass({ ...DEFAULT_GLASS, level: 3, frost: 30 });
		expect(tuned.frost).toBe(30);
		expect(tuned.tuned).toBe(true);
	});

	it("keeps surfaces solid when off, whatever the overrides say", () => {
		const g = resolveGlass({ ...DEFAULT_GLASS, level: 0, opacity: 30 });
		expect(g).toMatchObject({ on: false, opacity: 100, frost: 0, splay: 0 });
	});
});

describe("glassStyle and glassAttributes", () => {
	it("writes the variables the stylesheet reads", () => {
		const style = glassStyle({ ...DEFAULT_GLASS, level: 2 }, false);
		expect(style["--glass-frost"]).toBe("8px");
		expect(style["--glass-tint-pct"]).toBe("55%");
		expect(style["--glass-sheen-a"]).toBe("0.240");
		expect(
			glassStyle({ ...DEFAULT_GLASS, level: 2 }, true)["--glass-sheen-a"],
		).toBe("0.060");
	});

	it("marks only the chosen surfaces, and none when off", () => {
		const on = glassAttributes({
			...DEFAULT_GLASS,
			level: 1,
			apply: { navbar: true, search: false, headers: true, cards: false },
		});
		expect(on).toEqual({
			"data-glass-navbar": "",
			"data-glass-search": undefined,
			"data-glass-headers": "",
			"data-glass-cards": undefined,
		});
		expect(
			Object.values(glassAttributes(DEFAULT_GLASS)).every(
				(v) => v === undefined,
			),
		).toBe(true);
	});
});
