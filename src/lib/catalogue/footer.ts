export const FOOTER_TAGLINE_MAX = 120;

/** Trims the footer tagline to one capped line. */
export function normalizeTagline(tagline: unknown): string {
	if (typeof tagline !== "string") return "";
	return tagline.replace(/\s+/g, " ").trim().slice(0, FOOTER_TAGLINE_MAX);
}
