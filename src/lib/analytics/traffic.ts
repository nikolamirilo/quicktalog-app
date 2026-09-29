import { formatIsoDay } from "@/lib/format/date";

/**
 * Pure helpers for the catalogue analytics page: the date range, day filling,
 * KPI summaries and deltas. No I/O, so the page and tests share them.
 */

export const TRAFFIC_RANGES = [7, 30, 90] as const;
export type TrafficRange = (typeof TRAFFIC_RANGES)[number];
export const DEFAULT_TRAFFIC_RANGE: TrafficRange = 30;

/** Validates a `range` search param; anything unexpected falls back to 30. */
export function parseTrafficRange(value: unknown): TrafficRange {
	const raw = Array.isArray(value) ? value[0] : value;
	const days = Number(raw);
	return (TRAFFIC_RANGES as readonly number[]).includes(days)
		? (days as TrafficRange)
		: DEFAULT_TRAFFIC_RANGE;
}

export type TrafficDay = { date: string; views: number; visitors: number };

export type CatalogueTraffic = {
	range: TrafficRange;
	/** The last day of the current period, a UTC calendar day `YYYY-MM-DD`. */
	today: string;
	/** Every day of the current period, oldest first, zero-filled. */
	current: TrafficDay[];
	/** Every day of the previous period of equal length, oldest first. */
	previous: TrafficDay[];
	/** Distinct visitors over each whole period (not a sum of daily uniques). */
	uniqueVisitors: { current: number; previous: number };
};

/** Adds whole days to a `YYYY-MM-DD` date, in UTC so no DST shift applies. */
export function addDays(isoDate: string, days: number): string {
	const date = new Date(`${isoDate}T00:00:00Z`);
	date.setUTCDate(date.getUTCDate() + days);
	return date.toISOString().slice(0, 10);
}

/** `count` consecutive days ending on `end`, oldest first, missing days as 0. */
export function fillDays(
	byDate: Map<string, { views: number; visitors: number }>,
	end: string,
	count: number,
): TrafficDay[] {
	const days: TrafficDay[] = [];
	for (let offset = count - 1; offset >= 0; offset--) {
		const date = addDays(end, -offset);
		const row = byDate.get(date);
		days.push({
			date,
			views: row?.views ?? 0,
			visitors: row?.visitors ?? 0,
		});
	}
	return days;
}

/** The busiest day (most recent on ties), or null when nothing was viewed. */
export function busiestDay(days: TrafficDay[]): TrafficDay | null {
	let best: TrafficDay | null = null;
	for (const day of days) {
		if (day.views > 0 && (!best || day.views >= best.views)) best = day;
	}
	return best;
}

const sumViews = (days: TrafficDay[]) =>
	days.reduce((total, day) => total + day.views, 0);

export type TrafficSummary = {
	views: { current: number; previous: number };
	visitors: { current: number; previous: number };
	best: { current: TrafficDay | null; previous: TrafficDay | null };
	average: { current: number; previous: number };
};

export function summarizeTraffic(traffic: CatalogueTraffic): TrafficSummary {
	const current = sumViews(traffic.current);
	const previous = sumViews(traffic.previous);
	return {
		views: { current, previous },
		visitors: traffic.uniqueVisitors,
		best: {
			current: busiestDay(traffic.current),
			previous: busiestDay(traffic.previous),
		},
		average: {
			current: current / traffic.range,
			previous: previous / traffic.range,
		},
	};
}

export type TrafficDelta = {
	direction: "up" | "down" | "flat" | "none";
	/** The coloured part, e.g. "+12.3%". Empty when there is nothing to compare. */
	value: string;
	/** The rest of the line, e.g. "vs previous 30 days". */
	text: string;
};

/**
 * "+12.3% vs previous 30 days", rounded to one decimal; a zero previous
 * period is not divided by. `noun` names what was counted, for the
 * "No visitors in the previous 30 days" line.
 */
export function describeDelta(
	current: number,
	previous: number,
	range: TrafficRange,
	noun = "views",
): TrafficDelta {
	const period = `previous ${range} days`;
	if (previous <= 0) {
		return current > 0
			? { direction: "none", value: "", text: `No ${noun} in the ${period}` }
			: { direction: "flat", value: "", text: `No change vs ${period}` };
	}
	const pct = ((current - previous) / previous) * 100;
	const rounded = Math.round(pct * 10) / 10;
	if (rounded === 0) {
		return { direction: "flat", value: "0.0%", text: `vs ${period}` };
	}
	return {
		direction: rounded > 0 ? "up" : "down",
		value: `${rounded > 0 ? "+" : "−"}${Math.abs(rounded).toFixed(1)}%`,
		text: `vs ${period}`,
	};
}

/** "Sat, Sep 20" for a `YYYY-MM-DD` date, read as a calendar day (UTC). */
export function formatDay(
	isoDate: string,
	options: Intl.DateTimeFormatOptions = {
		weekday: "short",
		month: "short",
		day: "numeric",
	},
): string {
	return formatIsoDay(isoDate, options);
}
