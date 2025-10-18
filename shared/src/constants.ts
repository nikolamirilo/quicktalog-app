export const themes = [
	{
		key: "theme-elegant",
		label: "Elegant",
		image: "/themes/elegant.png",
		description:
			"A dark, refined theme with a subtle gradient background, light text, and cool blue accents. Ideal for upscale or modern venues seeking a sophisticated, minimal look. Uses serif headings and clean layouts for a premium feel.",
		type: "dark",
	},
	{
		key: "theme-luxury",
		label: "Luxury",
		image: "/themes/luxury.png",
		description:
			"A light, luxurious theme with gold and cream tones, dark elegant text, and premium accents. Designed for high-end restaurants, it features classic serif headings, gold highlights, and a soft, inviting background.",
		type: "light",
	},
	{
		key: "theme-modern",
		label: "Modern",
		image: "/themes/modern.png",
		description:
			"A bold, contemporary theme with deep blue backgrounds, white and pink accents, and modern sans-serif typography. Perfect for trendy or urban venues wanting a striking, energetic appearance.",
		type: "dark",
	},
	{
		key: "theme-organic",
		label: "Organic",
		image: "/themes/organic.png",
		description:
			"A fresh, natural theme with light beige backgrounds, green and brown accents, and soft, rounded typography. Ideal for organic, vegan, or eco-friendly restaurants seeking a wholesome, earthy vibe.",
		type: "light",
	},
	{
		key: "theme-creative",
		label: "Creative",
		image: "/themes/creative.png",
		description:
			"A vibrant, artistic theme with dark backgrounds, bright accent colors (red, yellow, blue), and playful, bold typography. Great for creative spaces, cafes, or venues wanting a fun, expressive look.",
		type: "dark",
	},
];

export const layouts = [
	{
		key: "variant_1",
		label: "Side Image",
		image: "/layouts/layout_1v_2.jpg",
		description:
			"Grid layout: Catalogue items are displayed in a responsive grid (1 column on mobile, 2 on desktop), with images and details shown together. Best for balanced, easy-to-browse catalogues.",
	},
	{
		key: "variant_2",
		label: "Top Image",
		image: "/layouts/layout_2v_2.jpg",
		description:
			"Horizontal card layout: Catalogue items are arranged in flexible horizontal cards, wrapping as needed. Ideal for showcasing items with wide images or for a modern, card-based look.",
	},
	{
		key: "variant_3",
		label: "Text Only",
		image: "/layouts/layout_3v_2.jpg",
		description:
			"Alternative grid layout: Similar to Layout 1 but with subtle style differences, such as spacing or card appearance. Useful for catalogues needing a slightly different grid presentation. This layout does not contain image.",
	},
	{
		key: "variant_4",
		label: "Carousel",
		image: "/layouts/layout_4v_2.jpg",
		description:
			"Carousel layout: Catalogue items are displayed in a horizontal scrollable carousel, allowing users to swipe or scroll through items. Great for featured items or visually rich catalogues.",
	},
];

export const DARK_THEMES = ["theme-elegant", "theme-modern", "theme-creative"];
export const DEFAULT_EMAIL = "quicktalog@outlook.com";
