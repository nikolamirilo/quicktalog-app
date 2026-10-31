import { creditStep } from "@/agent";
import { RequestCredits, UNMETERED } from "@/agent/core/credits";
import { CatalogueSession } from "@/agent/core/session";
import type { Catalogue } from "@quicktalog/common";
import { defaultCatalogueData } from "@quicktalog/common";
import { describe, expect, it } from "vitest";

const credits = (available: number, baseCoversFirstTask: boolean) =>
	new RequestCredits({ available, baseCoversFirstTask });

describe("RequestCredits", () => {
	it("pays for the first task from the base", () => {
		const c = credits(0, true);
		expect(c.reserveTask(0)).toBe(true);
		expect(c.billed).toBe(0);
	});

	it("refuses a second task when nothing is held", () => {
		const c = credits(0, true);
		c.reserveTask(0);
		expect(c.reserveTask(1)).toBe(false);
		expect(c.exhausted).toBe(true);
	});

	it("bills each completed task after the first", () => {
		const c = credits(3, true);
		for (const task of [0, 1, 2]) {
			c.reserveTask(task);
			c.settleTask(task, "done");
		}
		expect(c.billed).toBe(2);
	});

	it("bills every task on a continuation", () => {
		const c = credits(2, false);
		for (const task of [0, 1]) {
			c.reserveTask(task);
			c.settleTask(task, "done");
		}
		expect(c.billed).toBe(2);
		expect(c.reserveTask(2)).toBe(false);
	});

	it("charges a page read two credits", () => {
		const c = credits(3, true);
		expect(c.payForFetch()).toBe(true);
		expect(c.payForFetch()).toBe(false);
		expect(c.billed).toBe(2);
		expect(c.exhausted).toBe(false);
	});

	it("counts a pending reservation against what is left", () => {
		const c = credits(1, false);
		c.reserveTask(0);
		expect(c.payForFetch()).toBe(false);
	});

	it("skipping an untouched task is free", () => {
		const c = credits(1, false);
		c.reserveTask(0);
		c.settleTask(0, "skipped");
		expect(c.billed).toBe(0);
		expect(c.reserveTask(1)).toBe(true);
	});

	it("skipping a worked task still bills it", () => {
		const c = credits(2, false);
		c.reserveTask(0);
		c.recordEdit(0);
		c.settleTask(0, "skipped");
		expect(c.billed).toBe(1);
	});

	it("completing an unpaid task needs a credit", () => {
		const c = credits(0, false);
		expect(c.settleTask(0, "done")).toBe(false);
		expect(c.exhausted).toBe(true);
		expect(c.billed).toBe(0);
	});

	it("a task left pending is not billed", () => {
		const c = credits(2, false);
		c.reserveTask(0);
		c.recordEdit(0);
		expect(c.billed).toBe(0);
	});

	it("reserving twice holds once", () => {
		const c = credits(1, false);
		expect(c.reserveTask(0)).toBe(true);
		expect(c.reserveTask(0)).toBe(true);
		expect(c.reserveTask(1)).toBe(false);
	});

	it("tasksAffordable counts the base slot", () => {
		expect(credits(3, true).tasksAffordable).toBe(4);
		expect(credits(3, false).tasksAffordable).toBe(3);
	});

	it("never bills past the budget", () => {
		let seed = 7;
		const next = () => {
			seed = (seed * 48271) % 2147483647;
			return seed;
		};
		const c = credits(5, true);
		for (let i = 0; i < 200; i++) {
			const task = next() % 6;
			switch (next() % 5) {
				case 0:
					c.reserveTask(task);
					break;
				case 1:
					c.recordEdit(task);
					break;
				case 2:
					c.settleTask(task, "done");
					break;
				case 3:
					c.settleTask(task, "skipped");
					break;
				default:
					c.payForFetch();
			}
			expect(c.billed).toBeLessThanOrEqual(5);
		}
	});

	it("UNMETERED never refuses", () => {
		const c = new RequestCredits(UNMETERED);
		for (let task = 0; task < 50; task++) {
			expect(c.reserveTask(task)).toBe(true);
			expect(c.settleTask(task, "done")).toBe(true);
		}
		for (let i = 0; i < 10; i++) expect(c.payForFetch()).toBe(true);
	});
});

const catalogue = {
	...defaultCatalogueData,
	name: "cafe",
	content: [],
} as unknown as Catalogue;
const session = (available: number) =>
	new CatalogueSession(catalogue, {}, undefined, [], "u", null, 0, undefined, {
		available,
		baseCoversFirstTask: false,
	});

describe("creditStep", () => {
	it("forces a text-only step once credits are exhausted", () => {
		const s = session(0);
		s.credits.reserveTask(0);
		expect(s.credits.exhausted).toBe(true);
		expect(creditStep(s)).toEqual({ toolChoice: "none" });
	});

	it("leaves a step alone while credits last", () => {
		expect(creditStep(session(5))).toBeUndefined();
	});
});
