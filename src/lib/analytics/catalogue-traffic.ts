import "server-only";
import {
	addDays,
	type CatalogueTraffic,
	fillDays,
	type TrafficRange,
} from "@/lib/analytics/traffic";
import { type HogQLValues, runHogQL } from "@/utils/posthog";

/**
 * Page views of one published catalogue, read from PostHog.
 *
 * Days are UTC calendar days, on both sides: the app decides "today" (UTC) and
 * the queries bucket `toTimeZone(timestamp, 'UTC')`. HogQL's `today()` is not
 * timezone-aware while `timestamp` is shown in the project's timezone, so
 * mixing them could shift the window by a day; spelling out UTC everywhere
 * keeps the chart, the totals and the unique counts on the same days.
 *
 * A visit is matched on `$host` + `$pathname` rather than the full
 * `$current_url`, so links with `?utm_*`, `?fbclid` or a `#fragment` count.
 */

/** The UTC calendar day of an event, as HogQL. */
const DAY = "toDate(toTimeZone(timestamp, 'UTC'))";

/**
 * Both periods (previous + current), one statement each. The time bounds use
 * `timestamp` directly so PostHog can prune partitions.
 */
const WHERE = [
	"event = '$pageview'",
	"properties.$host = {host}",
	"properties.$pathname in ({path}, {pathSlash})",
	"timestamp >= toDateTime({from}, 'UTC')",
	"timestamp < toDateTime({until}, 'UTC')",
].join(" and ");

export const DAILY_QUERY = `select toString(${DAY}) as day, count() as views, count(distinct distinct_id) as visitors from events where ${WHERE} group by day order by day limit 1000`;

export const PERIOD_QUERY = `select count(distinct if(${DAY} >= toDate({currentFrom}), distinct_id, null)) as current_visitors, count(distinct if(${DAY} < toDate({currentFrom}), distinct_id, null)) as previous_visitors from events where ${WHERE}`;

/** Today's date in UTC, `YYYY-MM-DD`. */
export const utcToday = (now: Date = new Date()) =>
	now.toISOString().slice(0, 10);

/**
 * The placeholder values for both queries. Everything user-influenced (the
 * catalogue name, via the path) travels as a value, never as HogQL text.
 */
export function trafficQueryValues(
	catalogue: string,
	range: TrafficRange,
	today: string,
	baseUrl: string,
): HogQLValues {
	const host = new URL(baseUrl).host;
	const path = `/catalogues/${catalogue}`;
	return {
		host,
		path,
		pathSlash: `${path}/`,
		from: `${addDays(today, -(range * 2 - 1))} 00:00:00`,
		until: `${addDays(today, 1)} 00:00:00`,
		currentFrom: addDays(today, -(range - 1)),
	};
}

const toCount = (value: unknown) => {
	const n = Number(value);
	return Number.isFinite(n) && n > 0 ? Math.round(n) : 0;
};

/** Turns the two result sets into zero-filled periods. Exported for tests. */
export function parseTraffic(
	dailyRows: unknown[][],
	periodRows: unknown[][],
	range: TrafficRange,
	today: string,
): CatalogueTraffic {
	const byDate = new Map<string, { views: number; visitors: number }>();
	for (const row of dailyRows) {
		if (!Array.isArray(row) || typeof row[0] !== "string") continue;
		byDate.set(row[0], { views: toCount(row[1]), visitors: toCount(row[2]) });
	}
	const [period] = periodRows;
	const days = fillDays(byDate, today, range * 2);
	return {
		range,
		today,
		previous: days.slice(0, range),
		current: days.slice(range),
		uniqueVisitors: {
			current: toCount(period?.[0]),
			previous: toCount(period?.[1]),
		},
	};
}

/**
 * Traffic for the last `range` UTC days (today included) and the `range`
 * days before, so the page can show deltas. The two queries run in parallel,
 * each capped by `runHogQL`'s timeout, well inside the 60s route budget.
 * Call outside any database block: this is a network round trip.
 */
export async function fetchCatalogueTraffic(
	catalogue: string,
	range: TrafficRange,
	now: Date = new Date(),
): Promise<CatalogueTraffic> {
	const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
	if (!baseUrl) throw new Error("NEXT_PUBLIC_BASE_URL is not set");
	const today = utcToday(now);
	const values = trafficQueryValues(catalogue, range, today, baseUrl);

	const [dailyRows, periodRows] = await Promise.all([
		runHogQL(DAILY_QUERY, values),
		runHogQL(PERIOD_QUERY, values),
	]);
	return parseTraffic(dailyRows, periodRows, range, today);
}
