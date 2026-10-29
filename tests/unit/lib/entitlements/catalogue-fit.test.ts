import {
	catalogueFitsPlan,
	misfitMessage,
} from "@/lib/entitlements/catalogue-fit";
import { tiers } from "@quicktalog/common";
import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { canActivate } from "@/lib/entitlements/plan";

const named = (name: string) => tiers.find((t) => t.name === name)!;
const items = (id: string, count: number) => ({
	id,
	order: 0,
	type: "items",
	items: Array.from({ length: count }, (_, i) => ({ id: `${id}-${i}` })),
});
const block = (type: string, id = type) => ({ id, order: 0, type });

const overBasic = () => [
	items("a", 40),
	items("b", 40),
	...Array.from({ length: 6 }, (_, i) => block("text", `t${i}`)),
	block("embedding"),
];

describe("catalogueFitsPlan", () => {
	it("names every misfit", () => {
		const result = catalogueFitsPlan(overBasic(), named("Basic").features);
		expect(result).toEqual({
			ok: false,
			misfit: {
				items: { used: 80, limit: 30 },
				sections: { used: 9, limit: 8 },
				lockedTypes: ["embedding"],
			},
		});
	});

	it("passes a catalogue exactly at the limits", () => {
		const content = [
			items("a", 30),
			...Array.from({ length: 7 }, (_, i) => block("text", `t${i}`)),
		];
		expect(catalogueFitsPlan(content, named("Basic").features)).toEqual({
			ok: true,
		});
	});

	it("says what to remove", () => {
		const result = catalogueFitsPlan(overBasic(), named("Basic").features);
		if (!("misfit" in result)) throw new Error("expected a misfit");
		expect(misfitMessage(result.misfit, "Basic")).toBe(
			"Remove 50 item(s), 1 section(s) and the External content sections to fit the Basic plan.",
		);
	});
});

describe("canActivate", () => {
	const tx = (pageviews: number) =>
		({ execute: async () => [{ pageviews }] }) as never;

	it("refuses a catalogue over its plan, naming what to remove", async () => {
		const result = await canActivate(tx(0), named("Basic"), overBasic());
		expect(result.ok).toBe(false);
		expect(result.reason).toMatch(/Remove 50 item\(s\)/);
	});

	it("allows it once it fits", async () => {
		expect(await canActivate(tx(0), named("Basic"), [items("a", 30)])).toEqual({
			ok: true,
		});
	});

	it("still refuses over the traffic limit", async () => {
		const result = await canActivate(tx(10_000), named("Basic"), [
			items("a", 1),
		]);
		expect(result.ok).toBe(false);
		expect(result.reason).toMatch(/page view limit for this period/);
	});
});
