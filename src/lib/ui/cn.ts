import { type ClassValue, clsx } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

// Custom theme names tailwind-merge can't infer; without them `text-display-md`
// reads as a colour and is dropped next to `text-product-foreground`.
const twMerge = extendTailwindMerge({
	extend: {
		classGroups: {
			"font-size": [
				{
					text: [
						"display-xl",
						"display-lg",
						"display-md",
						"display-sm",
						"title-lg",
						"title-app",
						"lead",
						"lead-sm",
					],
				},
			],
			shadow: [{ shadow: ["product", "product-hover", "product-primary"] }],
			rounded: [{ rounded: ["product-card", "product-panel", "product-band"] }],
			"rounded-t": [
				{ "rounded-t": ["product-card", "product-panel", "product-band"] },
			],
			"rounded-b": [
				{ "rounded-b": ["product-card", "product-panel", "product-band"] },
			],
			"bg-image": [
				{
					bg: [
						"product-amber-panel",
						"product-amber-strip",
						"product-amber-glow",
					],
				},
			],
		},
	},
});

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}
