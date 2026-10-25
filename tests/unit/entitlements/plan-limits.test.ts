import { defaultCatalogueData, tiers } from "@quicktalog/common";
import type { SQL } from "drizzle-orm";
import { PgDialect } from "drizzle-orm/pg-core";
import { describe, expect, it } from "vitest";
import { DEFAULT_BACKGROUND } from "@/lib/catalogue/background";
import { DEFAULT_GLASS } from "@/lib/catalogue/glass";
import {
	applyPlanDowngrade,
	applyPlanToCatalogue,
} from "@/lib/entitlements/catalogue";
import { tierForPlanId } from "@/lib/entitlements/plan";
import { CATALOGUE_EDITABLE_FIELDS, pickEditable } from "@/utils/db/columns";

const starter = tiers[0];
const paid = tiers.find((tier) => tier.features.branding) ?? tiers[1];

describe("pickEditable", () => {
	it("keeps only client-editable fields", () => {
		const picked = pickEditable({
			id: "cat_1",
			name: "lux-watches",
			userId: "user_a",
			status: "active",
			source: "builder",
			createdAt: "2026-01-01",
			updatedAt: "2026-01-02",
			heading: "Watches",
			content: [],
		});

		expect(Object.keys(picked).sort()).toEqual(["content", "heading"]);
	});

	it("never lists a server-owned column", () => {
		for (const field of ["id", "name", "userId", "status", "source"]) {
			expect(CATALOGUE_EDITABLE_FIELDS).not.toContain(field);
		}
	});
});

describe("tierForPlanId", () => {
	it("maps a known price id to its tier and anything else to Starter", () => {
		expect(tierForPlanId(paid.priceId.month).name).toBe(paid.name);
		expect(tierForPlanId("pri_unknown").name).toBe(starter.name);
		expect(tierForPlanId(null).name).toBe(starter.name);
	});
});

describe("applyPlanToCatalogue", () => {
	const branded = {
		header: { type: "custom" as const },
		footer: { type: "custom" as const, newsletter: true },
	} as never;

	it("strips branding and newsletter on a plan without them", () => {
		const result = applyPlanToCatalogue(branded, starter) as {
			header: { type: string };
			footer: { type: string; newsletter: boolean };
		};
		expect(result.header.type).toBe("default");
		expect(result.footer.type).toBe("default");
		expect(result.footer.newsletter).toBe(false);
	});

	it("keeps branding on a plan that includes it", () => {
		const result = applyPlanToCatalogue(branded, paid) as {
			header: { type: string };
			footer: { newsletter: boolean };
		};
		expect(result.header.type).toBe("custom");
		expect(result.footer.newsletter).toBe(paid.features.newsletter);
	});

	it("keeps the default header and footer when the owner chose them on a branded plan", () => {
		const result = applyPlanToCatalogue(
			{
				header: { type: "default" as const },
				footer: { type: "custom" as const, newsletter: false },
			} as never,
			paid,
		) as { header: { type: string }; footer: { type: string } };
		expect(result.header.type).toBe("default");
		expect(result.footer.type).toBe("custom");
	});
});

describe("applyPlanToCatalogue appearance", () => {
	const named = (name: string) => tiers.find((t) => t.name === name)!;
	const styled = {
		appearance: {
			theme: { type: "custom", name: "custom", colors: { primary: "#ff0000" } },
			style: {
				contentFontSize: "large",
				fontFamily: "lora",
				borderRadius: 30,
				shadow: "high",
			},
			overlay: { isEnabled: true, icon: "star" },
		},
	} as never;
	type Appearance = {
		appearance: {
			theme: { type: string; name: string; colors?: unknown };
			style: unknown;
			overlay: unknown;
		};
	};

	it("resets style and overlay to the defaults on a plan without style controls", () => {
		const { appearance } = applyPlanToCatalogue(
			styled,
			named("Basic"),
		) as Appearance;
		expect(appearance.style).toEqual(defaultCatalogueData.appearance.style);
		expect(appearance.overlay).toEqual(defaultCatalogueData.appearance.overlay);
	});

	it("resets a custom theme to the default theme on Basic", () => {
		const { appearance } = applyPlanToCatalogue(
			styled,
			named("Basic"),
		) as Appearance;
		expect(appearance.theme).toEqual(defaultCatalogueData.appearance.theme);
	});

	it("keeps a standard theme on Basic", () => {
		const { appearance } = applyPlanToCatalogue(
			{
				appearance: { theme: { type: "standard", name: "theme-coffee" } },
			} as never,
			named("Basic"),
		) as Appearance;
		expect(appearance.theme.name).toBe("theme-coffee");
	});

	it("leaves appearance alone on Pro", () => {
		const { appearance } = applyPlanToCatalogue(
			styled,
			named("Pro"),
		) as Appearance;
		expect(appearance.theme.type).toBe("custom");
		expect((appearance.style as { shadow: string }).shadow).toBe("high");
	});

	// One flag now gates all five, so one call must clear all five.
	it("resets theme, style, overlay, glass and background together on Basic", () => {
		const everything = {
			appearance: {
				...(styled as unknown as Appearance).appearance,
				glass: { level: 3, opacity: 40, frost: 18, splay: 6, apply: {} },
				background: {
					isEnabled: true,
					type: "color",
					gradient: "oat",
					color: "#123456",
					image: null,
					fade: 50,
				},
			},
		} as never;

		const { appearance } = applyPlanToCatalogue(
			everything,
			named("Basic"),
		) as Appearance & {
			appearance: { glass: unknown; background: unknown };
		};

		expect(appearance.theme).toEqual(defaultCatalogueData.appearance.theme);
		expect(appearance.style).toEqual(defaultCatalogueData.appearance.style);
		expect(appearance.overlay).toEqual(defaultCatalogueData.appearance.overlay);
		expect(appearance.glass).toEqual(DEFAULT_GLASS);
		expect(appearance.background).toEqual(DEFAULT_BACKGROUND);
	});
});

describe("applyPlanToCatalogue glass, search and tagline", () => {
	const named = (name: string) => tiers.find((t) => t.name === name)!;
	const glassy = {
		appearance: {
			...defaultCatalogueData.appearance,
			glass: { level: 3, opacity: 200, frost: 10, splay: null, apply: {} },
			search: { isEnabled: true, placeholder: "y".repeat(80) },
			background: {
				isEnabled: true,
				type: "color",
				color: "#0F1424",
				fade: 99,
			},
		},
		footer: {
			...defaultCatalogueData.footer,
			tagline: `  a\n  b ${"z".repeat(200)}`,
		},
	} as never;
	type Out = {
		appearance: {
			glass: typeof DEFAULT_GLASS;
			background: typeof DEFAULT_BACKGROUND;
			search: { isEnabled: boolean; placeholder: string };
		};
		footer: { tagline: string };
	};

	it("turns glass off on a plan without style controls but keeps search", () => {
		const { appearance } = applyPlanToCatalogue(glassy, named("Basic")) as Out;
		expect(appearance.glass).toEqual(DEFAULT_GLASS);
		expect(appearance.background).toEqual(DEFAULT_BACKGROUND);
		expect(appearance.search.isEnabled).toBe(true);
		expect(appearance.search.placeholder).toHaveLength(40);
	});

	it("keeps glass on Pro, clamped", () => {
		const { appearance } = applyPlanToCatalogue(glassy, named("Pro")) as Out;
		expect(appearance.glass.level).toBe(3);
		expect(appearance.glass.opacity).toBe(85);
		expect(appearance.glass.apply.cards).toBe(true);
		expect(appearance.background).toMatchObject({
			isEnabled: true,
			type: "color",
			color: "#0f1424",
			fade: 80,
		});
	});

	it("collapses the tagline to one capped line", () => {
		const { footer } = applyPlanToCatalogue(glassy, named("Pro")) as Out;
		expect(footer.tagline.startsWith("a b z")).toBe(true);
		expect(footer.tagline).toHaveLength(120);
	});

	it("does not add glass or search to a payload without them", () => {
		const { appearance } = applyPlanToCatalogue(
			{
				appearance: { theme: { type: "standard", name: "theme-coffee" } },
			} as never,
			named("Pro"),
		) as Out;
		expect("glass" in appearance).toBe(false);
		expect("search" in appearance).toBe(false);
	});
});

describe("applyPlanDowngrade appearance", () => {
	const named = (name: string) => tiers.find((t) => t.name === name)!;
	const statements = async (tierName: string) => {
		const dialect = new PgDialect();
		const seen: { sql: string; params: unknown[] }[] = [];
		const tx = {
			execute: async (query: SQL) => {
				seen.push(dialect.sqlToQuery(query));
				return [];
			},
		};
		await applyPlanDowngrade(tx as never, "user-1", named(tierName));
		return seen;
	};

	it("resets style and custom theme on stored catalogues", async () => {
		const seen = await statements("Starter");
		const style = seen.find((q) => q.sql.includes("'{style}'"));
		expect(style?.params).toContain(
			JSON.stringify(defaultCatalogueData.appearance.style),
		);
		expect(style?.sql).toContain("'{glass}'");
		expect(style?.params).toContain(JSON.stringify(DEFAULT_GLASS));
		expect(style?.params).toContain(JSON.stringify(DEFAULT_BACKGROUND));
		const theme = seen.find((q) => q.sql.includes("'{theme}'"));
		expect(theme?.sql).toContain("'custom'");
	});

	it("leaves appearance alone when the plan keeps it", async () => {
		const seen = await statements("Premium");
		expect(seen.some((q) => q.sql.includes("'{style}'"))).toBe(false);
		expect(seen.some((q) => q.sql.includes("'{theme}'"))).toBe(false);
	});
});
