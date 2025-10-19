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
					"primary-accent": "var(--product-primary-accent)",
					"product-foreground-accent": "var(--product-foreground-accent)",
					"hero-product-background": "var(--hero-product-background)",
					"product-border": "var(--product-border)",
					"product-hover-background": "var(--product-hover-background)",
					"product-icon": "var(--product-icon)",
					"product-shadow": "var(--product-shadow)",
					"button-text": "var(--button-text)",
					"product-hover-scale": "var(--product-hover-scale)",
					"product-hover-shadow": "var(--product-hover-shadow)",

					/* Gradient backgrounds */
					"product-gradient-primary": "var(--product-gradient-primary)",

					/* Navbar button hover colors */
					"navbar-button-hover-bg": "var(--navbar-button-hover-bg)",
					"navbar-button-hover-text": "var(--navbar-button-hover-text)",
					"navbar-button-hover-border": "var(--navbar-button-hover-border)",
					"navbar-button-hover-shadow": "var(--navbar-button-hover-shadow)",
					"navbar-button-active-bg": "var(--navbar-button-active-bg)",
					"navbar-button-active-text": "var(--navbar-button-active-text)",
					"navbar-button-transition": "var(--navbar-button-transition)",
					"navbar-button-hover-transform":
						"var(--navbar-button-hover-transform)",
					"navbar-button-focus-ring": "var(--navbar-button-focus-ring)",
					"navbar-button-hover-scale": "var(--navbar-button-hover-scale)",
					"navbar-button-active": "var(--navbar-button-active)",

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
					error: "var(--error-color)",
					"card-bg": "var(--card-bg)",
					"card-text": "var(--card-text)",
					"card-heading": "var(--card-heading)",
					"card-description": "var(--card-description)",
					"card-border": "var(--card-border)",
					"section-bg": "var(--section-bg)",
					"section-heading": "var(--section-heading)",
					"section-border": "var(--section-border)",
					"section-icon": "var(--section-icon)",
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
