import type { Config } from "tailwindcss";
import { withUt } from "uploadthing/tw";

const withMT = require("@material-tailwind/react/utils/withMT");

export default withUt(
	withMT({
		darkMode: ["class"],
		content: [
			"./pages/**/*.{js,ts,jsx,tsx,mdx}",
			"./components/**/*.{js,ts,jsx,tsx,mdx}",
			"./app/**/*.{js,ts,jsx,tsx,mdx}",
		],
		theme: {
			extend: {
				colors: {
					"product-background": "var(--product-background)",
					"product-foreground": "var(--product-foreground)",
					"product-primary": "var(--product-primary)",
					"product-secondary": "var(--product-secondary)",
					"product-primary-accent": "var(--product-primary-accent)",
					"product-foreground-accent": "var(--product-foreground-accent)",
					"product-background-hero": "var(--product-background-hero)",
					"product-border": "var(--product-border)",
					"product-background-hover": "var(--product-background-hover)",
					"product-icon": "var(--product-icon)",
					"product-shadow": "var(--product-shadow)",
					"button-text": "var(--button-text)",
					"product-scale-hover": "var(--product-scale-hover)",
					"product-shadow-hover": "var(--product-shadow-hover)",


					/* Navbar button hover colors */
					"product-nav-hover-bg": "var(--product-nav-hover-bg)",
					"product-nav-hover-text": "var(--product-nav-hover-text)",
					"product-nav-hover-border": "var(--product-nav-hover-border)",
					"product-nav-transition": "var(--product-nav-transition)",
					"product-nav-focus-ring": "var(--product-nav-focus-ring)",
					"product-nav-active": "var(--product-nav-active)",

					primary: "var(--primary)",
					secondary: "var(--secondary)",
					accent: "var(--accent)",
					card: "var(--card)",
					background: "var(--background)",
					foreground: "var(--foreground)",
					border: "var(--border)",
					heading: "var(--heading)",
					text: "var(--text)",
					price: "var(--price)",
					error: "var(--product-error)",
					"card-bg": "var(--card-bg)",
					"card-text": "var(--card-text)",
					"card-heading": "var(--card-heading)",
					"card-description": "var(--card-description)",
					"card-border": "var(--card-border)",
					"section-bg": "var(--section-bg)",
					"section-heading": "var(--section-heading)",
					"section-border": "var(--section-border)",
					"section-hover": "var(--section-hover)",

					/* Footer Variables */
					"footer-bg": "var(--footer-bg, var(--section-bg))",
					"footer-text": "var(--footer-text, var(--section-heading))",
					"footer-border": "var(--footer-border, var(--section-border))",
					"header-bg": "var(--header-bg)",

					/* Section Header Variables */
					"section-header-bg": "var(--section-header-bg)",
					"section-header-text": "var(--section-header-text)",
					"section-header-border": "var(--section-header-border)",
					"section-header-shadow": "var(--section-header-shadow)",
					"section-header-hover-bg": "var(--section-header-hover-bg)",
					"section-header-hover-shadow": "var(--section-header-hover-shadow)",
					"section-header-accent": "var(--section-header-accent)",
					"section-header-gradient": "var(--section-header-gradient)",

					/* Typography Variables */
					"font-family-heading": "var(--font-family-heading)",
					"font-family-body": "var(--font-family-body)",
					"font-weight-heading": "var(--font-weight-heading)",
					"font-weight-body": "var(--font-weight-body)",
					"letter-spacing-heading": "var(--letter-spacing-heading)",
					"letter-spacing-body": "var(--letter-spacing-body)",
				},
				fontFamily: {
					lora: ["var(--font-lora-regular)"],
					"lora-semibold": ["var(--font-lora-semibold)"],
					// Custom typography classes that map to CSS variables
					heading: ["var(--font-family-heading)"],
					body: ["var(--font-family-body)"],
				},
				fontWeight: {
					heading: "var(--font-weight-heading)",
					body: "var(--font-weight-body)",
				},
				letterSpacing: {
					heading: "var(--letter-spacing-heading)",
					body: "var(--letter-spacing-body)",
				},
				borderRadius: {
					lg: "var(--radius)",
					md: "calc(var(--radius) - 2px)",
					sm: "calc(var(--radius) - 4px)",
				},
				scrollbar: {
					thin: "thin",
					thumb: {
						"product-primary/25": "rgba(229, 194, 48, 0.25)",
					},
					track: {
						transparent: "transparent",
					},
				},
			},
		},
		plugins: [require("tailwindcss-animate")],
	}),
) satisfies Config;
