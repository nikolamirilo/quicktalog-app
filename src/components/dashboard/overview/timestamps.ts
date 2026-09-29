/**
 * Timestamps from Drizzle `mode: "string"` columns arrive as Postgres text,
 * e.g. `2026-09-29 10:00:00.123456+00`, which is not ISO 8601 and which
 * `Date.parse` reads differently per browser. Normalise before parsing.
 */
export function parseTimestamp(value: string | null | undefined): number {
	if (!value) return Number.NaN;
	const match = value.match(
		/^(\d{4}-\d{2}-\d{2})[ T](\d{2}:\d{2}(?::\d{2})?)(?:\.(\d+))?(Z|[+-]\d{2}(?::?\d{2})?)?$/,
	);
	if (!match) return Date.parse(value);
	const [, day, time, fraction, zone] = match;
	const ms = fraction ? `.${fraction.slice(0, 3).padEnd(3, "0")}` : "";
	let offset = zone ?? "Z";
	if (/^[+-]\d{2}$/.test(offset)) offset = `${offset}:00`;
	else if (/^[+-]\d{4}$/.test(offset))
		offset = `${offset.slice(0, 3)}:${offset.slice(3)}`;
	return Date.parse(`${day}T${time}${ms}${offset}`);
}

/** `YYYY-MM-DD` (UTC) for exports; falls back to the raw text's first 10 chars. */
export function toIsoDay(value: string): string {
	const time = parseTimestamp(value);
	return Number.isNaN(time)
		? value.slice(0, 10)
		: new Date(time).toISOString().slice(0, 10);
}
