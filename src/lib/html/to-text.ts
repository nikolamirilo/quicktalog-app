export function htmlToText(html: string): string {
	if (!html) return "";

	return html
		.replace(
			/<\/(p|div|section|article|header|footer|aside|li|ul|ol|table|tr|td|th|h[1-6])>/gi,
			"\n",
		)
		.replace(/<(br|hr)\s*\/?>/gi, "\n")
		.replace(/<[^>]+>/g, "")
		.replace(/&nbsp;/g, " ")
		.replace(/&amp;/g, "&")
		.replace(/&lt;/g, "<")
		.replace(/&gt;/g, ">")
		.replace(/&quot;/g, '"')
		.replace(/&#39;/g, "'")
		.replace(/[ \t]+/g, " ")
		.replace(/\n{3,}/g, "\n\n")
		.trim();
}
