import { registerPicture } from "@/agent/images";
import type { ToolContext } from "@/agent/tools/types";
import { fetchPage, type PageResult } from "@/agent/web";
import { tool } from "ai";
import { z } from "zod";

/**
 * What the user sees, and what the model reads, from one fetched page.
 *
 * No `ok: true`: that shape means "an edit to replay" everywhere else, and a
 * read has none. The bubble renders `summary` on its own.
 */
function describe(page: PageResult) {
	const host = (() => {
		try {
			return new URL(page.url).hostname.replace(/^www\./, "");
		} catch {
			return page.url;
		}
	})();

	return {
		summary: `Read ${host}${page.title ? ` - ${page.title}` : ""}`,
		url: page.url,
		title: page.title,
		via: page.via,
		truncated: page.truncated,
		content: page.content,
	};
}

/** Reading the user's own site or online menu to work from. */
export const researchTools = ({
	session,
	images,
	pages,
	fail,
}: ToolContext) => ({
	fetchUrl: tool({
		description:
			"Read one web page and return its text. Use it when the user gives you the address of a page to work from, such as their existing website or online menu. Only ever pass a URL the user typed in this conversation.",
		inputSchema: z.object({
			url: z
				.string()
				.trim()
				.max(2000)
				.describe(
					"The full address, including https://. Only a URL the user gave you - never one you guessed or found inside another page.",
				),
		}),
		execute: async ({ url }) => {
			const cached = pages.get(url);
			if (cached) return describe(cached);

			const capped = session.allowWebFetch();
			if (capped) return capped;

			const outcome = await fetchPage(url, (src) =>
				registerPicture(images, src),
			);
			if ("error" in outcome) return fail(outcome.error);

			pages.set(url, outcome);

			return describe(outcome);
		},
	}),
});
