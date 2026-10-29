import {
	USAGE_PERIOD_EPOCH,
	usagePeriod,
	usagePeriodDays,
} from "@quicktalog/common";
import { describe, expect, it } from "vitest";

/**
 * The mirror of `private.usage_period_*` that the Cloudflare traffic job uses. The two
 * must agree: the dates below were taken from the applied migration on TEST
 * (.claude/plans/active/2026-10-29-usage-period-from-signup/verification.md).
 */

const iso = (signup: string, now: string) => {
	const { start, end } = usagePeriod(signup, new Date(now));
	return [start.toISOString(), end.toISOString()];
};

describe("usagePeriod", () => {
	// now() is before USAGE_PERIOD_EPOCH, so the switch-over clamp is inert.
	const before = "2026-10-29T21:00:00.000Z";

	it("starts the first period on the signup day at 00:00 UTC", () => {
		expect(iso("2026-10-29T20:00:00.000Z", before)).toEqual([
			"2026-10-29T00:00:00.000Z",
			"2026-11-28T00:00:00.000Z",
		]);
	});

	it("steps in whole 30-day periods, never part of one", () => {
		expect(iso("2026-09-29T00:00:00.000Z", before)).toEqual([
			"2026-10-29T00:00:00.000Z",
			"2026-11-28T00:00:00.000Z",
		]);
		expect(iso("2026-08-30T12:00:00.000Z", before)).toEqual([
			"2026-10-29T00:00:00.000Z",
			"2026-11-28T00:00:00.000Z",
		]);
	});

	it("ignores month lengths and leap days", () => {
		expect(iso("2026-02-28T12:00:00.000Z", before)).toEqual([
			"2026-10-26T00:00:00.000Z",
			"2026-11-25T00:00:00.000Z",
		]);
		expect(iso("2025-12-31T23:00:00.000Z", before)).toEqual([
			"2026-10-27T00:00:00.000Z",
			"2026-11-26T00:00:00.000Z",
		]);
		expect(iso("2024-02-29T00:00:00.000Z", before)).toEqual([
			"2026-10-16T00:00:00.000Z",
			"2026-11-15T00:00:00.000Z",
		]);
	});

	it("does not step backwards for a signup in the future (clock skew)", () => {
		expect(iso("2026-10-30T00:00:00.000Z", before)).toEqual([
			"2026-10-30T00:00:00.000Z",
			"2026-11-29T00:00:00.000Z",
		]);
	});

	it("holds now() inside the period, whatever the signup date", () => {
		const now = new Date(before);
		for (const days of [0, 1, 2, 29, 30, 31, 60, 61, 900]) {
			const signup = new Date(now.getTime() - days * 86_400_000);
			const { start, end } = usagePeriod(signup, now);
			expect(start.getTime()).toBeLessThanOrEqual(now.getTime());
			expect(end.getTime()).toBeGreaterThan(now.getTime());
		}
	});

	describe("after the switch-over", () => {
		// The epoch has passed, so no period may reach back past it.
		const after = "2026-11-15T10:00:00.000Z";

		it("clamps a period that started before it, without moving the reset date", () => {
			expect(iso("2026-01-05T09:00:00.000Z", after)).toEqual([
				USAGE_PERIOD_EPOCH,
				"2026-12-01T00:00:00.000Z",
			]);
			expect(iso("2020-03-01T00:00:00.000Z", after)).toEqual([
				USAGE_PERIOD_EPOCH,
				"2026-11-25T00:00:00.000Z",
			]);
		});

		it("leaves a period that starts after it alone", () => {
			expect(iso("2026-10-16T23:30:00.000Z", after)).toEqual([
				"2026-11-15T00:00:00.000Z",
				"2026-12-15T00:00:00.000Z",
			]);
		});
	});
});

describe("usagePeriodDays", () => {
	it("gives the UTC days analytics.day is filtered on, end exclusive", () => {
		expect(
			usagePeriodDays(
				"2026-10-06T13:12:53.806Z",
				new Date("2026-10-29T21:00:00.000Z"),
			),
		).toEqual({ start: "2026-10-06", end: "2026-11-05" });
	});
});
