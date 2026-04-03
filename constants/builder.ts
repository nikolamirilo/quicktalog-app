import { HeadingSize } from "@/types/shared";

export const fontFamilyMap: Record<string, string> = {
	inter: "var(--font-inter)",
	arial: "Arial, sans-serif",
	lora: "var(--font-lora-regular)",
	playfair: "var(--font-playfair-display)",
	nunito: "var(--font-nunito)",
	crimson: "var(--font-crimson-text)",
	poppins: "var(--font-poppins)",
};

export const contentFontSizeMap: Record<string, string> = {
	small: "clamp(0.75rem, 0.7rem + 0.15vw, 0.875rem)",
	medium: "clamp(0.875rem, 0.8rem + 0.25vw, 1rem)",
	large: "clamp(1rem, 0.9rem + 0.5vw, 1.125rem)",
};

export const titleFontSizeMap: Record<string, string> = {
	small: "clamp(1rem, 0.9rem + 0.25vw, 1.125rem)",
	medium: "clamp(1.125rem, 1rem + 0.5vw, 1.25rem)",
	large: "clamp(1.25rem, 1.1rem + 0.75vw, 1.5rem)",
};

export const shadowMap: Record<string, string> = {
	none: "none",
	low: "0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)",
	medium: "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
	high: "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)",
};

export const headingSizeMap: Record<HeadingSize, string> = {
	extraLarge: "text-4xl md:text-5xl lg:text-6xl",
	large: "text-3xl md:text-4xl lg:text-5xl",
	medium: "text-2xl md:text-3xl lg:text-4xl",
	small: "text-xl md:text-2xl lg:text-3xl",
};
