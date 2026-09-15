"use client";

import {
	type HtmlProfile,
	sanitizeCatalogueHtml,
} from "@/helpers/sanitizeHtml";

export default function HtmlContent({
	html,
	className,
	unstyled,
	profile = "text",
	...props
}: {
	html: string;
	className?: string;
	/**
	 * Skip the `.rich-text-content` typography rules. For markup that carries its
	 * own styling (custom code blocks), inheriting them is interference.
	 */
	unstyled?: boolean;
	/**
	 * How much markup this call site is allowed to render. `text` is prose;
	 * `embed` additionally permits iframes, from allowlisted hosts only.
	 */
	profile?: HtmlProfile;
}) {
	// Filtered here rather than at every caller: this component is the single
	// place author HTML becomes live DOM, so anything that reaches the page has
	// been through the allowlist - whoever wrote it and however old the row is.
	// Runs on the server too, so the markup is already clean in the SSR output.
	return (
		<div
			className={`${unstyled ? "" : "rich-text-content"} ${className || ""}`.trim()}
			dangerouslySetInnerHTML={{ __html: sanitizeCatalogueHtml(html, profile) }}
			suppressHydrationWarning
			{...props}
		/>
	);
}
