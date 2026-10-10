import { describe, expect, it } from "vitest";
import {
	addDays,
	busiestDay,
	type CatalogueTraffic,
	describeDelta,
	fillDays,
	parseTrafficRange,
	summarizeTraffic,
} from "@/lib/analytics/traffic";

describe("parseTrafficRange", () => {
	it("accepts 7, 30 and 90", () => {
		expect(parseTrafficRange("7")).toBe(7);
		expect(parseTrafficRange("30")).toBe(30);
		expect(parseTrafficRange(["90", "7"])).toBe(90);
	});

	it("falls back to 30 for anything else", () => {
		expect(parseTrafficRange(undefined)).toBe(30);
		expect(parseTrafficRange("365")).toBe(30);
		expect(parseTrafficRange("7; drop table")).toBe(30);
	});
});

describe("fillDays", () => {
	it("zero-fills every day up to the end date, oldest first", () => {
		const byDate = new Map([["2026-09-27", { views: 4, visitors: 2 }]]);
		expect(fillDays(byDate, "2026-09-28", 3)).toEqual([
			{ date: "2026-09-26", views: 0, visitors: 0 },
			{ date: "2026-09-27", views: 4, visitors: 2 },
			{ date: "2026-09-28", views: 0, visitors: 0 },
		]);
	});

	it("crosses month ends", () => {
		expect(addDays("2026-03-01", -1)).toBe("2026-02-28");
	});
});

describe("describeDelta", () => {
	it("shows a signed percentage against the previous period", () => {
		expect(describeDelta(112.3, 100, 30)).toEqual({
			direction: "up",
			value: "+12.3%",
			text: "vs previous 30 days",
		});
		expect(describeDelta(50, 100, 7).direction).toBe("down");
	});

	it("rounds to one decimal and uses a real minus sign for drops", () => {
		expect(describeDelta(2, 3, 7).value).toBe("−33.3%");
		expect(describeDelta(1, 3, 7).value).toBe("−66.7%");
		expect(describeDelta(200, 100, 90).value).toBe("+100.0%");
	});

	it("calls a change that rounds to zero flat", () => {
		expect(describeDelta(1000.4, 1000, 30)).toEqual({
			direction: "flat",
			value: "0.0%",
			text: "vs previous 30 days",
		});
	});

	it("never divides by an empty previous period", () => {
		expect(describeDelta(5, 0, 30)).toEqual({
			direction: "none",
			value: "",
			text: "No views in the previous 30 days",
		});
		expect(describeDelta(0, 0, 30).direction).toBe("flat");
	});

	it("names what was counted", () => {
		expect(describeDelta(5, 0, 7, "visitors").text).toBe(
			"No visitors in the previous 7 days",
		);
	});
});

describe("summarizeTraffic", () => {
	it("totals views, averages over the whole range and finds the busiest day", () => {
		const traffic: CatalogueTraffic = {
			range: 7,
			today: "2026-09-28",
			current: fillDays(
				new Map([
					["2026-09-25", { views: 10, visitors: 5 }],
					["2026-09-28", { views: 4, visitors: 3 }],
				]),
				"2026-09-28",
				7,
			),
			previous: fillDays(new Map(), "2026-09-21", 7),
			uniqueVisitors: { current: 7, previous: 0 },
		};
		const summary = summarizeTraffic(traffic);
		expect(summary.views).toEqual({ current: 14, previous: 0 });
		expect(summary.average.current).toBe(2);
		expect(summary.best.current?.date).toBe("2026-09-25");
		expect(summary.best.previous).toBeNull();
	});

	it("prefers the most recent day on a tie", () => {
		expect(
			busiestDay([
				{ date: "2026-09-01", views: 3, visitors: 1 },
				{ date: "2026-09-02", views: 3, visitors: 1 },
			])?.date,
		).toBe("2026-09-02");
	});
});
