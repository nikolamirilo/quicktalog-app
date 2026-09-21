import { persistTheme } from "@/actions/themes";
import type { ToolContext } from "@/agent/tools/types";
import type { AgentToolResult } from "@/types/ai";
import { tool } from "ai";
import { z } from "zod";

const HEX_COLOR = /^#[0-9a-fA-F]{6}$/;

export const customColorsSchema = z
	.object({
		background: z
			.string()
			.regex(HEX_COLOR)
			.describe("Page background as a six-digit hex colour, e.g. #f3f3f3."),
		heading: z
			.string()
			.regex(HEX_COLOR)
			.describe("Heading colour as a six-digit hex colour, e.g. #000000."),
		text: z
			.string()
			.regex(HEX_COLOR)
			.describe("Body text colour as a six-digit hex colour, e.g. #1a1a1a."),
		primary: z
			.string()
			.regex(HEX_COLOR)
			.describe(
				"Primary brand colour as a six-digit hex colour, e.g. #2563eb. Used for buttons, links, prices and category accents.",
			),
		secondary: z
			.string()
			.regex(HEX_COLOR)
			.describe(
				"Secondary brand colour as a six-digit hex colour, e.g. #4d4d4d.",
			),
		cardBackground: z
			.string()
			.regex(HEX_COLOR)
			.describe(
				"Card / surface background as a six-digit hex colour, e.g. #ffffff.",
			),
	})
	.describe(
		"Six-colour palette that switches the theme to the Custom theme. All six colours are required.",
	);

export const appearanceFieldsSchema = z.object({
	theme: z.string().trim().max(60).optional(),
	fontFamily: z.string().trim().max(40).optional(),
	contentFontSize: z.enum(["small", "medium", "large"]).optional(),
	borderRadius: z.coerce.number().min(0).max(64).optional(),
	shadow: z.enum(["none", "low", "medium", "high"]).optional(),
	customColors: customColorsSchema.optional(),
});

export const setCustomThemeSchema = z.object({
	name: z
		.string()
		.trim()
		.min(1)
		.max(60)
		.describe(
			"Short name to save the theme under in the user's theme library (1-60 characters). The user picks this; if they did not say one, ask them for it instead of guessing.",
		),
	colors: customColorsSchema,
});

/** The Appearance tab: theme, font, sizing, shadows, custom palettes. */
export const appearanceTools = ({ session }: ToolContext) => ({
	updateAppearance: tool({
		description: "Change the catalogue's theme, font, sizing or shadows.",
		inputSchema: z.object({ fields: appearanceFieldsSchema }),
		execute: async ({ fields }): Promise<AgentToolResult> =>
			session.run({ op: "update_appearance", fields }),
	}),

	setCustomTheme: tool({
		description:
			"Build a custom theme from six colours, apply it to the catalogue, and save it to the user's theme library under the given name. Use this whenever the user wants a look that none of the built-in themes offer, or when they name specific colours to use. The name is required: if the user did not say one, ask them for it instead of guessing.",
		inputSchema: setCustomThemeSchema,
		execute: async ({ name, colors }): Promise<AgentToolResult> => {
			const result = session.run({
				op: "update_appearance",
				fields: { customColors: colors },
			});
			if (!result.ok) return result;

			// The catalogue change is what the user asked for; the save is a
			// convenience. If the save fails, the theme still lands and the
			// model can tell the user how to retry from the Appearance tab.
			if (!session.userId) {
				return {
					...result,
					saveError:
						"Not signed in, so the custom theme was applied but not saved.",
				};
			}

			const saved = await persistTheme(session.userId, name, colors);
			if (saved.success && saved.data) {
				return { ...result, savedTheme: { name: saved.data.name } };
			}
			return {
				...result,
				saveError: saved.error ?? "Could not save the theme.",
			};
		},
	}),
});
