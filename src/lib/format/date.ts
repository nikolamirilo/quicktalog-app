/** Formats a plain ISO day ("2026-09-29") in UTC, so it never shifts by a day. */
export function formatIsoDay(
	iso: string,
	options: Intl.DateTimeFormatOptions = {
		year: "numeric",
		month: "long",
		day: "numeric",
	},
): string {
	return new Date(`${iso.slice(0, 10)}T00:00:00Z`).toLocaleDateString("en-US", {
		...options,
		timeZone: "UTC",
	});
}
