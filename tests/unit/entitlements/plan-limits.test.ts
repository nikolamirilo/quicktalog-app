import { tiers } from "@quicktalog/common";
import { describe, expect, it } from "vitest";
import { applyPlanToCatalogue } from "@/lib/entitlements/catalogue";
import { tierForPlanId } from "@/lib/entitlements/plan";
import { CATALOGUE_EDITABLE_FIELDS, pickEditable } from "@/utils/db/columns";

const starter = tiers[0];
const paid = tiers.find((tier) => tier.features.branding) ?? tiers[1];

describe("pickEditable", () => {
	it("keeps only client-editable fields", () => {
		const picked = pickEditable({
			id: "cat_1",
			name: "lux-watches",
			createdBy: "user_a",
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
		for (const field of ["id", "name", "createdBy", "status", "source"]) {
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
});
