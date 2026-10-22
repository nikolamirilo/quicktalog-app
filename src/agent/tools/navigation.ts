import type { ToolContext } from "@/agent/tools/types";
import type { AgentToolResult } from "@/types/ai";
import { tool } from "ai";
import { z } from "zod";

/** Matches the sliders in HeaderTab and the footer's LogoSizeSection. */
const HEADER_LOGO_WIDTH = { min: 20, max: 300 } as const;
const FOOTER_LOGO_WIDTH = { min: 20, max: 400 } as const;

const layoutTypeSchema = z
	.enum(["default", "custom"])
	.describe(
		'"default" is the standard layout. "custom" turns on the configurable one, which is what the other fields here control.',
	);

const ctaSchema = z
	.object({
		isEnabled: z.coerce.boolean().optional(),
		label: z
			.string()
			.trim()
			.max(40)
			.optional()
			.describe('Button text, e.g. "Book a table".'),
		url: z
			.string()
			.trim()
			.max(2000)
			.optional()
			.describe(
				"Where the button goes. Only an address the user gave you - never one you invent.",
			),
	})
	.optional()
	.describe("The call-to-action button.");

export const headerFieldsSchema = z.object({
	type: layoutTypeSchema.optional(),
	cta: ctaSchema,
	phoneCta: z.coerce
		.boolean()
		.optional()
		.describe(
			"Show the phone icon. Needs a phone number in the contact details.",
		),
	emailCta: z.coerce
		.boolean()
		.optional()
		.describe("Show the email icon. Needs an email in the contact details."),
	logoWidth: z.coerce
		.number()
		.min(HEADER_LOGO_WIDTH.min)
		.max(HEADER_LOGO_WIDTH.max)
		.optional()
		.describe(
			`Logo width in pixels, ${HEADER_LOGO_WIDTH.min} to ${HEADER_LOGO_WIDTH.max}.`,
		),
});

export const footerFieldsSchema = z.object({
	type: layoutTypeSchema.optional(),
	cta: ctaSchema,
	newsletter: z.coerce
		.boolean()
		.optional()
		.describe("Show the newsletter sign-up form."),
	showPartners: z.coerce
		.boolean()
		.optional()
		.describe("Show the partners the user has added."),
	logoWidth: z.coerce
		.number()
		.min(FOOTER_LOGO_WIDTH.min)
		.max(FOOTER_LOGO_WIDTH.max)
		.optional()
		.describe(
			`Logo width in pixels, ${FOOTER_LOGO_WIDTH.min} to ${FOOTER_LOGO_WIDTH.max}.`,
		),
});

export const legalFieldsSchema = z.object({
	legalName: z
		.string()
		.trim()
		.max(120)
		.optional()
		.describe("Registered business name shown in the footer."),
	address: z.string().trim().max(200).optional(),
	termsAndConditions: z
		.string()
		.max(20000)
		.optional()
		.describe(
			"The terms and conditions text shown in the footer. Write it only when the user asks you to; never invent terms they did not agree to.",
		),
	privacyPolicy: z
		.string()
		.max(20000)
		.optional()
		.describe(
			"The privacy policy text shown in the footer. Write it only when the user asks you to; never invent claims about what they do with data.",
		),
});

/** The Header and Footer tabs. Legal lives here too since it renders in and is edited via the Footer tab. */
export const navigationTools = ({ session }: ToolContext) => ({
	updateHeader: tool({
		description:
			"Change the header that sits above the catalogue: its layout, the call-to-action button, the phone and email icons, and the logo size.",
		inputSchema: z.object({ fields: headerFieldsSchema }),
		execute: async ({ fields }): Promise<AgentToolResult> =>
			session.run({ op: "update_header", fields }),
	}),

	updateFooter: tool({
		description:
			"Change the footer at the bottom of the catalogue: its layout, the call-to-action button, the newsletter form, whether partners are shown, and the logo size.",
		inputSchema: z.object({ fields: footerFieldsSchema }),
		execute: async ({ fields }): Promise<AgentToolResult> =>
			session.run({ op: "update_footer", fields }),
	}),

	updateLegal: tool({
		description:
			"Change the legal details shown in the footer: registered business name, address, terms and conditions, privacy policy.",
		inputSchema: z.object({ fields: legalFieldsSchema }),
		execute: async ({ fields }): Promise<AgentToolResult> =>
			session.run({ op: "update_catalogue", fields: { legal: fields } }),
	}),
});
