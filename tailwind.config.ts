import type { Config } from "tailwindcss";
import { withUt } from "uploadthing/tw";

const withMT = require("@material-tailwind/react/utils/withMT");

const productColorNames = [
	"background",
	"background-hero",
	"card",
	"background-hover",
	"dark",
	"dark-raised",
	"dark-deep",
	"foreground",
	"foreground-accent",
	"muted",
	"on-dark",
	"on-dark-muted",
	"on-dark-subtle",
	"border",
	"border-strong",
	"border-hover",
	"primary",
	"primary-accent",
	"primary-ink",
	"primary-soft",
	"primary-bright",
	"secondary",
	"secondary-soft",
	"error",
	"error-soft",
	"error-ink",
	"warning",
	"success",
	"success-bright",
	"success-soft",
	"success-on-dark",
	"info",
	"info-soft",
	"chart",
] as const;

const productColors = Object.fromEntries(
	productColorNames.map((name) => [
		`product-${name}`,
		`rgb(var(--product-${name}-rgb) / <alpha-value>)`,
	]),
);

const config = withUt(
	withMT({
		darkMode: ["class"],
		content: [
			"./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
			"./src/components/**/*.{js,ts,jsx,tsx,mdx}",
			"./src/app/**/*.{js,ts,jsx,tsx,mdx}",
			"./src/constants/**/*.{js,ts}",
		],
		theme: {
			extend: {
				colors: {
					...productColors,

					/* Navbar button hover colors */
					"product-nav-active": "var(--product-nav-active)",

					/* Catalogue theme colors */
					primary: "var(--catalogue-primary)",
					secondary: "var(--catalogue-secondary)",
					accent: "var(--catalogue-accent)",
					card: "var(--card)",
					background: "var(--catalogue-background)",
					foreground: "var(--catalogue-foreground)",
					border: "var(--border)",
					heading: "var(--catalogue-heading)",
					text: "var(--catalogue-text)",
					price: "var(--catalogue-price)",
					error: "var(--product-error)",
					"catalogue-button-text": "var(--catalogue-button-text)",
					"catalogue-card-background": "var(--catalogue-card-background)",
					"catalogue-card-text": "var(--catalogue-card-text)",
					"catalogue-card-heading": "var(--catalogue-card-heading)",
					"catalogue-card-description": "var(--catalogue-card-description)",
					"catalogue-card-border": "var(--catalogue-card-border)",
					"catalogue-section-background": "var(--catalogue-section-background)",
					"catalogue-section-border": "var(--catalogue-section-border)",

					/* Navigation (Header & Footer) */
					"catalogue-navigation-background":
						"var(--catalogue-navigation-background)",
					"catalogue-navigation-text": "var(--catalogue-navigation-text)",
					"catalogue-navigation-border": "var(--catalogue-navigation-border)",

					/* Category Header */
					"catalogue-category-accent": "var(--catalogue-category-accent)",
					"catalogue-category-gradient": "var(--catalogue-category-gradient)",
					"catalogue-category-shadow": "var(--catalogue-category-shadow)",
					"catalogue-category-border": "var(--catalogue-category-border)",
				},
				fontFamily: {
					"product-heading": ["var(--product-font-heading)"],
					"product-body": ["var(--product-font-body)"],
					lora: ["var(--font-lora-regular)"],
					"lora-semibold": ["var(--font-lora-semibold)"],
					playfair: ["var(--font-playfair-display)"],
					heading: ["var(--catalogue-font-heading)"],
					body: ["var(--catalogue-font-body)"],
				},
				fontWeight: {
					"heading-weight": "var(--catalogue-weight-heading)",
					body: "var(--catalogue-weight-body)",
				},
				fontSize: {
					"display-xl": [
						"clamp(36px, 5.4vw, 62px)",
						{
							lineHeight: "1.06",
							letterSpacing: "-0.035em",
							fontWeight: "800",
						},
					],
					"display-lg": [
						"clamp(34px, 5.2vw, 60px)",
						{
							lineHeight: "1.06",
							letterSpacing: "-0.035em",
							fontWeight: "800",
						},
					],
					"display-md": [
						"clamp(30px, 4.2vw, 50px)",
						{ lineHeight: "1.1", letterSpacing: "-0.03em", fontWeight: "800" },
					],
					"display-sm": [
						"clamp(26px, 3vw, 36px)",
						{ lineHeight: "1.12", letterSpacing: "-0.03em", fontWeight: "800" },
					],
					"title-lg": [
						"clamp(21px, 2.2vw, 26px)",
						{ lineHeight: "1.2", letterSpacing: "-0.02em", fontWeight: "800" },
					],
					"title-app": [
						"clamp(24px, 3vw, 32px)",
						{
							lineHeight: "1.15",
							letterSpacing: "-0.025em",
							fontWeight: "800",
						},
					],
					lead: ["clamp(17px, 1.6vw, 20px)", { lineHeight: "1.6" }],
					"lead-sm": ["clamp(16.5px, 1.4vw, 18.5px)", { lineHeight: "1.65" }],
				},
				backgroundImage: {
					"product-amber-panel":
						"linear-gradient(160deg, #fff4dc 0%, #fffbf2 45%, #fff 100%)",
					"product-amber-strip":
						"linear-gradient(100deg, #fff 0%, #fff6e2 55%, #ffe7b3 100%)",
					"product-amber-glow":
						"radial-gradient(80% 90% at 50% 45%, #fff1d2 0%, #fffbf1 70%)",
				},
				boxShadow: {
					product: "var(--product-shadow)",
					"product-hover": "var(--product-shadow-hover)",
					"product-primary": "var(--product-shadow-primary)",
				},
				letterSpacing: {
					heading: "var(--catalogue-spacing-heading)",
				},
				borderRadius: {
					"product-card": "var(--product-radius-card)",
					"product-panel": "var(--product-radius-panel)",
					"product-band": "var(--product-radius-band)",
					lg: "var(--radius)",
					md: "calc(var(--radius) - 2px)",
					sm: "calc(var(--radius) - 4px)",
				},
			},
		},
		plugins: [require("tailwindcss-animate")],
	}),
) satisfies Config;

// withMT adds an object-valued `lg-max` screen, which silently disables arbitrary min-[…]/max-[…] variants.
delete (config.theme?.screens as Record<string, unknown> | undefined)?.[
	"lg-max"
];

export default config;
