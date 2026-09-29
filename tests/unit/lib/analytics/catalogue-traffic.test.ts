import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
	DAILY_QUERY,
	fetchCatalogueTraffic,
	PERIOD_QUERY,
	parseTraffic,
	trafficQueryValues,
} from "@/lib/analytics/catalogue-traffic";

const NOW = new Date("2026-09-29T23:30:00Z");

beforeEach(() => {
	vi.stubEnv("NEXT_PUBLIC_POSTHOG_HOST", "https://eu.posthog.test/");
	vi.stubEnv("POSTHOG_PROJECT_ID", "42");
	vi.stubEnv("POSTHOG_API_KEY", "phx_test");
	vi.stubEnv("NEXT_PUBLIC_BASE_URL", "https://www.quicktalog.test");
});

afterEach(() => {
	vi.unstubAllEnvs();
	vi.unstubAllGlobals();
});

const respond = (results: unknown[][]) =>
	new Response(JSON.stringify({ results }), { status: 200 });

describe("trafficQueryValues", () => {
	it("covers both periods as whole UTC days, today included", () => {
		expect(
			trafficQueryValues("bean-there", 7, "2026-09-29", "https://x.test"),
		).toEqual({
			host: "x.test",
			path: "/catalogues/bean-there",
			pathSlash: "/catalogues/bean-there/",
			from: "2026-09-16 00:00:00",
			until: "2026-09-30 00:00:00",
			currentFrom: "2026-09-23",
		});
	});
});

describe("HogQL queries", () => {
	it("reference every value as a placeholder and spell out UTC", () => {
		for (const query of [DAILY_QUERY, PERIOD_QUERY]) {
			expect(query).toContain("{host}");
			expect(query).toContain("{path}");
			expect(query).toContain("toTimeZone(timestamp, 'UTC')");
			expect(query).not.toContain("today()");
			expect(query).not.toContain("$current_url");
		}
		expect(PERIOD_QUERY).toContain("{currentFrom}");
	});
});

describe("fetchCatalogueTraffic", () => {
	it("posts HogQL with values, never the name inside the query text", async () => {
		const fetchMock = vi.fn(async () => respond([]));
		vi.stubGlobal("fetch", fetchMock);
		const hostile = "x' or 1=1 --";

		await fetchCatalogueTraffic(hostile, 30, NOW);

		expect(fetchMock).toHaveBeenCalledTimes(2);
		const [url, init] = fetchMock.mock.calls[0] as unknown as [
			string,
			RequestInit,
		];
		expect(url).toBe("https://eu.posthog.test/api/projects/42/query/");
		expect(init.method).toBe("POST");
		expect((init.headers as Record<string, string>).Authorization).toBe(
			"Bearer phx_test",
		);
		const body = JSON.parse(String(init.body));
		expect(body.query.kind).toBe("HogQLQuery");
		expect(body.query.query).toBe(DAILY_QUERY);
		expect(body.query.query).not.toContain(hostile);
		expect(body.query.values).toMatchObject({
			host: "www.quicktalog.test",
			path: `/catalogues/${hostile}`,
			currentFrom: "2026-08-31",
		});
	});

	it("zero-fills the days and splits them into the two periods", async () => {
		vi.stubGlobal(
			"fetch",
			vi.fn(async (_url: string, init: RequestInit) => {
				const { query } = JSON.parse(String(init.body)).query;
				return query === DAILY_QUERY
					? respond([
							["2026-09-22", 4, 2],
							["2026-09-23", "7", "3"],
							["2026-09-29", 1, 1],
							["not-a-row"],
						])
					: respond([[5, 2]]);
			}),
		);

		const traffic = await fetchCatalogueTraffic("bean-there", 7, NOW);

		expect(traffic.today).toBe("2026-09-29");
		expect(traffic.current).toHaveLength(7);
		expect(traffic.previous).toHaveLength(7);
		expect(traffic.current[0]).toEqual({
			date: "2026-09-23",
			views: 7,
			visitors: 3,
		});
		expect(traffic.current[6]).toEqual({
			date: "2026-09-29",
			views: 1,
			visitors: 1,
		});
		expect(traffic.previous[6]).toEqual({
			date: "2026-09-22",
			views: 4,
			visitors: 2,
		});
		expect(traffic.uniqueVisitors).toEqual({ current: 5, previous: 2 });
	});

	it("fails loudly on an error response", async () => {
		vi.stubGlobal(
			"fetch",
			vi.fn(async () => new Response("nope", { status: 500 })),
		);
		await expect(fetchCatalogueTraffic("a", 7, NOW)).rejects.toThrow(
			/PostHog query failed: 500/,
		);
	});

	it("fails without the PostHog settings", async () => {
		vi.stubEnv("POSTHOG_API_KEY", "");
		vi.stubGlobal("fetch", vi.fn());
		await expect(fetchCatalogueTraffic("a", 7, NOW)).rejects.toThrow(/API key/);
	});
});

describe("parseTraffic", () => {
	it("treats missing or negative counts as zero", () => {
		const traffic = parseTraffic(
			[["2026-09-29", -3, null]],
			[],
			7,
			"2026-09-29",
		);
		expect(traffic.current[6]).toEqual({
			date: "2026-09-29",
			views: 0,
			visitors: 0,
		});
		expect(traffic.uniqueVisitors).toEqual({ current: 0, previous: 0 });
	});
});
