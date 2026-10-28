import type { ToolContext } from "@/agent/tools/types";
import { MAX_SOCIALS } from "@/constants";
import { HEADING_CHAR_LIMIT } from "@/lib/catalogue/heading";
import { BUSINESS_TYPE_VALUES } from "@quicktalog/common";
import type { AgentToolResult } from "@/types/ai";
import { tool } from "ai";
import { z } from "zod";

export const catalogueFieldsSchema = z.object({
	heading: z
		.string()
		.max(HEADING_CHAR_LIMIT * 4)
		.optional()
		.describe(
			`The big title at the top of the page. Plain text, at most ${HEADING_CHAR_LIMIT} characters - the builder owns its size and styling, so do not write an <h1> or classes. <strong> and <em> are allowed inside it. An empty string removes it.`,
		),
	currency: z.string().trim().max(10).optional(),
	language: z.string().trim().max(10).optional(),
	businessType: z.enum(BUSINESS_TYPE_VALUES).optional(),
	logo: z
		.string()
		.trim()
		.max(2000)
		.optional()
		.describe(
			"Address of an image the user has already uploaded, or an empty string to remove the logo. Never invent one.",
		),
	metadata: z
		.object({
			title: z.string().trim().max(120).optional(),
			description: z.string().trim().max(400).optional(),
			icon: z
				.string()
				.trim()
				.max(2000)
				.optional()
				.describe(
					"Browser tab icon. An address the user has already uploaded, never one you invent.",
				),
		})
		.optional(),
	contact: z
		.object({
			phone: z.string().trim().max(40).optional(),
			email: z.string().trim().max(120).optional(),
			website: z.string().trim().max(200).optional(),
			socials: z
				.array(z.string().trim().max(200))
				.max(MAX_SOCIALS)
				.optional()
				.describe(
					`Full profile addresses, at most ${MAX_SOCIALS}. This replaces the whole list, so include the ones already there that the user wants to keep.`,
				),
		})
		.optional(),
});

/** The General tab: what the catalogue is, how to reach it, how it looks to search engines. */
export const generalTools = ({ session }: ToolContext) => ({
	updateCatalogue: tool({
		description:
			"Change catalogue-wide settings: heading, currency, language, business type, logo, SEO metadata or contact details including social links.",
		inputSchema: z.object({ fields: catalogueFieldsSchema }),
		execute: async ({ fields }): Promise<AgentToolResult> =>
			session.run({ op: "update_catalogue", fields }),
	}),
});
