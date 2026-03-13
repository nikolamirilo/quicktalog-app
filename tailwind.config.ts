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
					lora: ["var(--font-lora-regular)"],
					"lora-semibold": ["var(--font-lora-semibold)"],
					heading: ["var(--catalogue-font-heading)"],
					body: ["var(--catalogue-font-body)"],
				},
				fontWeight: {
					"heading-weight": "var(--catalogue-weight-heading)",
					body: "var(--catalogue-weight-body)",
				},
				letterSpacing: {
					heading: "var(--catalogue-spacing-heading)",
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
