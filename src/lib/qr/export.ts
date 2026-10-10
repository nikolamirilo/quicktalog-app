import type QRCodeStyling from "qr-code-styling";

/**
 * Browser-only download helpers, plus the frame-text layout the preview
 * shares with them. Without frame text the code downloads as qr-code-styling
 * renders it; with frame text a bar is composed under the code.
 *
 * One sizing rule everywhere: the bar is 15% of the code's width and the text
 * is a single line in the heading font at 5.8% of the width, shrunk until it
 * fits 90% of the width. The preview draws the bar as an SVG with the same
 * numbers, so what you see is what you download.
 */

export type QrExtension = "png" | "jpeg" | "svg";

export type FrameBar = {
	text: string;
	/** Bar colour: the design's dots colour. */
	barColor: string;
	/** Text colour and page colour: the design's background. */
	textColor: string;
};

export type FrameLayout = {
	/** Bar height in px (at the code's width). */
	bar: number;
	fontSize: number;
	/** Measured text width at `fontSize`, or null when it could not be measured. */
	textWidth: number | null;
};

const BAR_RATIO = 0.15;
const FONT_RATIO = 0.058;
const TEXT_WIDTH_RATIO = 0.9;
const MIN_FONT = 8;

/**
 * Declared in exported SVGs. next/font renames the page's font family, so the
 * real name goes first for viewers that have it installed, then common
 * fallbacks. `textLength` keeps the measured width whichever font renders.
 */
export const SVG_FONT_STACK =
	"'Plus Jakarta Sans', 'Helvetica Neue', Arial, sans-serif";

export async function downloadQr(
	qr: QRCodeStyling,
	extension: QrExtension,
	name: string,
	frame: FrameBar | null,
): Promise<void> {
	if (!frame) {
		await qr.download({ extension, name });
		return;
	}
	const raw = await qr.getRawData(extension);
	if (!(raw instanceof Blob)) throw new Error("QR code could not be rendered");
	const blob =
		extension === "svg"
			? await composeSvg(raw, frame)
			: await composeRaster(raw, extension, frame);
	saveBlob(blob, `${name}.${extension}`);
}

function saveBlob(blob: Blob, filename: string) {
	const url = URL.createObjectURL(blob);
	const link = document.createElement("a");
	link.href = url;
	link.download = filename;
	document.body.appendChild(link);
	link.click();
	link.remove();
	setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * The heading font as the canvas and the preview see it: the resolved
 * `--product-font-heading` (next/font's renamed family) plus a fallback.
 */
export function headingFontFamily(): string {
	if (typeof document === "undefined") return "sans-serif";
	const value = getComputedStyle(document.body)
		.getPropertyValue("--product-font-heading")
		.trim();
	return value ? `${value}, Arial, sans-serif` : "Arial, sans-serif";
}

/** The layout before any text is measured (server render, no canvas). */
export function baseFrameLayout(width: number): FrameLayout {
	return {
		bar: Math.round(width * BAR_RATIO),
		fontSize: Math.round(width * FONT_RATIO),
		textWidth: null,
	};
}

/**
 * Bar height and the single-line font size for `text` under a code `width`
 * px wide. Text in scripts the heading font lacks is measured with whatever
 * fallback font the browser uses for those glyphs, like the canvas draws it.
 */
export function frameLayout(
	text: string,
	width: number,
	family: string = headingFontFamily(),
): FrameLayout {
	const unmeasured = baseFrameLayout(width);
	const { bar, fontSize: base } = unmeasured;
	const maxWidth = width * TEXT_WIDTH_RATIO;
	const ctx =
		typeof document === "undefined"
			? null
			: document.createElement("canvas").getContext("2d");
	if (!ctx) return unmeasured;

	ctx.font = `800 ${base}px ${family}`;
	const measured = ctx.measureText(text).width;
	if (measured <= maxWidth) return { bar, fontSize: base, textWidth: measured };
	const fontSize = Math.max(MIN_FONT, Math.floor((base * maxWidth) / measured));
	ctx.font = `800 ${fontSize}px ${family}`;
	return { bar, fontSize, textWidth: ctx.measureText(text).width };
}

export const escapeXml = (value: string) =>
	value.replace(
		/[&<>"']/g,
		(c) =>
			({
				"&": "&amp;",
				"<": "&lt;",
				">": "&gt;",
				'"': "&quot;",
				"'": "&apos;",
			})[c] as string,
	);

/**
 * The framed SVG document: `inner` (qr-code-styling's own SVG, already
 * serialised) above a bar with the text. Every user value is escaped.
 */
export function framedSvgMarkup({
	inner,
	width,
	height,
	frame,
	layout,
}: {
	inner: string;
	width: number;
	height: number;
	frame: FrameBar;
	layout: FrameLayout;
}): string {
	const { bar, fontSize, textWidth } = layout;
	const total = height + bar;
	const fit =
		textWidth === null
			? ""
			: ` textLength="${Math.round(textWidth * 100) / 100}" lengthAdjust="spacingAndGlyphs"`;
	return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${width}" height="${total}" viewBox="0 0 ${width} ${total}"><rect width="${width}" height="${total}" fill="${escapeXml(frame.textColor)}"/>${inner}<rect y="${height}" width="${width}" height="${bar}" fill="${escapeXml(frame.barColor)}"/><text x="${width / 2}" y="${height + bar / 2}" text-anchor="middle" dominant-baseline="central" font-family="${escapeXml(SVG_FONT_STACK)}" font-weight="800" font-size="${fontSize}"${fit} fill="${escapeXml(frame.textColor)}">${escapeXml(frame.text)}</text></svg>`;
}

async function composeSvg(raw: Blob, frame: FrameBar): Promise<Blob> {
	const source = (await raw.text()).replace(/<\?xml[^>]*\?>\s*/, "");
	const doc = new DOMParser().parseFromString(source, "image/svg+xml");
	const root = doc.documentElement;
	const width = Number.parseFloat(root.getAttribute("width") ?? "") || 300;
	const height = Number.parseFloat(root.getAttribute("height") ?? "") || width;
	root.setAttribute("x", "0");
	root.setAttribute("y", "0");
	const inner = new XMLSerializer().serializeToString(root);
	const svg = framedSvgMarkup({
		inner,
		width,
		height,
		frame,
		layout: frameLayout(frame.text, width),
	});
	return new Blob([svg], { type: "image/svg+xml" });
}

function loadImage(blob: Blob): Promise<HTMLImageElement> {
	return new Promise((resolve, reject) => {
		const url = URL.createObjectURL(blob);
		const img = new Image();
		img.onload = () => {
			URL.revokeObjectURL(url);
			resolve(img);
		};
		img.onerror = () => {
			URL.revokeObjectURL(url);
			reject(new Error("QR image could not be loaded"));
		};
		img.src = url;
	});
}

async function composeRaster(
	raw: Blob,
	extension: "png" | "jpeg",
	frame: FrameBar,
): Promise<Blob> {
	const img = await loadImage(raw);
	const width = img.naturalWidth;
	const height = img.naturalHeight;
	const family = headingFontFamily();
	const { bar, fontSize } = frameLayout(frame.text, width, family);

	const canvas = document.createElement("canvas");
	canvas.width = width;
	canvas.height = height + bar;
	const ctx = canvas.getContext("2d");
	if (!ctx) throw new Error("Canvas is not available");

	ctx.fillStyle = frame.textColor;
	ctx.fillRect(0, 0, width, height + bar);
	ctx.drawImage(img, 0, 0, width, height);
	ctx.fillStyle = frame.barColor;
	ctx.fillRect(0, height, width, bar);

	ctx.font = `800 ${fontSize}px ${family}`;
	ctx.fillStyle = frame.textColor;
	ctx.textAlign = "center";
	ctx.textBaseline = "middle";
	ctx.fillText(frame.text, width / 2, height + bar / 2);

	return new Promise((resolve, reject) => {
		canvas.toBlob(
			(blob) => (blob ? resolve(blob) : reject(new Error("Export failed"))),
			`image/${extension}`,
			0.95,
		);
	});
}
