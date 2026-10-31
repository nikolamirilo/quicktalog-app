import { headingSizeMap } from "@/constants/builder";
import type { HeadingSize } from "@/types/shared";

export const HEADING_CHAR_LIMIT = 100;

export const DEFAULT_HEADING_SIZE: HeadingSize = "large";

const HEADING_SIZES: HeadingSize[] = ["extraLarge", "large", "medium", "small"];

const isHeadingSize = (value: string): value is HeadingSize =>
	(HEADING_SIZES as string[]).includes(value);

/**
 * The one shape a stored heading has. The builder, the published page and the
 * agent's edits all go through here, so a heading written by the assistant
 * carries the same classes and the same `data-size` as one typed in the
 * builder - without it the page draws the heading at body size.
 */
export function wrapHeading(innerHtml: string, size: HeadingSize): string {
	const inner = clampHeading(innerHtml);
	return `<h1 class="${headingSizeMap[size]} font-heading text-heading drop-shadow-sm mb-4 text-center break-words pb-1 md:pb-2 w-full max-w-[98%] mx-auto" data-size="${size}">${inner}</h1>`;
}

/** The inner markup and the size of a stored heading, whatever shape it is in. */
export function parseHeading(stored: string | undefined | null): {
	inner: string;
	size: HeadingSize | null;
} {
	const value = stored ?? "";
	const sizeMatch = value.match(/data-size="([^"]+)"/);
	const size = sizeMatch && isHeadingSize(sizeMatch[1]) ? sizeMatch[1] : null;
	const innerMatch = value.match(/<h1[^>]*>([\s\S]*)<\/h1>/);
	return { inner: (innerMatch ? innerMatch[1] : value).trim(), size };
}

/** Text of a heading, for a character count or a page title. */
export function headingText(stored: string | undefined | null): string {
	return parseHeading(stored)
		.inner.replace(/<[^>]*>/g, " ")
		.replace(/&nbsp;/g, " ")
		.replace(/\s+/g, " ")
		.trim();
}

export function isHeadingEmpty(stored: string | undefined | null): boolean {
	return headingText(stored).length === 0;
}

/**
 * Cuts a heading to the limit the heading box enforces, counting the text a
 * visitor reads rather than the markup around it: the assistant is told the
 * limit, and this is what holds it to it.
 */
function clampHeading(innerHtml: string): string {
	const text = innerHtml.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ");
	if (text.length <= HEADING_CHAR_LIMIT) return innerHtml;
	// Over the limit, formatting is dropped rather than cut mid-tag.
	return text.slice(0, HEADING_CHAR_LIMIT).trim();
}
