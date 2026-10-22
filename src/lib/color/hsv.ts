/** Hue in degrees (0-360); saturation and value from 0 to 1. */
export type Hsv = { h: number; s: number; v: number };

const HEX = /^#[0-9a-f]{6}$/i;

/** `#rrggbb` as HSV. Anything that isn't a six-digit hex reads as black. */
export function hexToHsv(hex: string): Hsv {
	const safe = HEX.test(hex) ? hex : "#000000";
	const r = Number.parseInt(safe.slice(1, 3), 16) / 255;
	const g = Number.parseInt(safe.slice(3, 5), 16) / 255;
	const b = Number.parseInt(safe.slice(5, 7), 16) / 255;
	const max = Math.max(r, g, b);
	const delta = max - Math.min(r, g, b);

	let h = 0;
	if (delta !== 0) {
		if (max === r) h = ((g - b) / delta) % 6;
		else if (max === g) h = (b - r) / delta + 2;
		else h = (r - g) / delta + 4;
		h *= 60;
		if (h < 0) h += 360;
	}
	return { h, s: max === 0 ? 0 : delta / max, v: max };
}

/** HSV as lowercase `#rrggbb`; hue wraps, saturation and value are clamped. */
export function hsvToHex({ h, s, v }: Hsv): string {
	const hue = ((h % 360) + 360) % 360;
	const sat = Math.min(1, Math.max(0, s));
	const val = Math.min(1, Math.max(0, v));
	const chroma = val * sat;
	const x = chroma * (1 - Math.abs(((hue / 60) % 2) - 1));
	const m = val - chroma;
	const [r, g, b] = [
		[chroma, x, 0],
		[x, chroma, 0],
		[0, chroma, x],
		[0, x, chroma],
		[x, 0, chroma],
		[chroma, 0, x],
	][Math.floor(hue / 60) % 6];
	const channel = (n: number) =>
		Math.round((n + m) * 255)
			.toString(16)
			.padStart(2, "0");
	return `#${channel(r)}${channel(g)}${channel(b)}`;
}
