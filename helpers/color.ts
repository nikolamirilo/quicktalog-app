const HEX = /^#[0-9a-f]{6}$/i;
const SHORT_HEX = /^#[0-9a-f]{3}$/i;

export const normalizeHexColor = (value: unknown): string | undefined => {
	if (typeof value !== "string") return undefined;
	const color = value.trim().toLowerCase();
	if (HEX.test(color)) return color;
	if (SHORT_HEX.test(color)) {
		const [r, g, b] = color.slice(1);
		return `#${r}${r}${g}${g}${b}${b}`;
	}
	return undefined;
};

const linearChannel = (value: number) => {
	const channel = value / 255;
	return channel <= 0.03928
		? channel / 12.92
		: ((channel + 0.055) / 1.055) ** 2.4;
};

// WCAG 2 relative luminance of a #rrggbb color.
export const relativeLuminance = (hex: string): number => {
	const [r, g, b] = [1, 3, 5].map((start) =>
		linearChannel(Number.parseInt(hex.slice(start, start + 2), 16)),
	);
	return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

export const contrastRatio = (a: string, b: string): number => {
	const [lighter, darker] = [relativeLuminance(a), relativeLuminance(b)].sort(
		(x, y) => y - x,
	);
	return (lighter + 0.05) / (darker + 0.05);
};

// "Dark" means white text is more legible on it than black text, so there's no tuned threshold.
export const isDarkColor = (hex: string): boolean =>
	contrastRatio("#ffffff", hex) > contrastRatio("#000000", hex);
