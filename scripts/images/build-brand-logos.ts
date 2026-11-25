/**
 * Builds the square (1:1) and landscape (4:1) Quicktalog logos that app
 * directories, marketplaces and press kits ask for.
 *
 *   npm run images:logos
 *
 * The magnifier mark is redrawn here as real vector geometry, measured off
 * `public/images/brand/icon-512.png`, because every brand SVG in the repo is a
 * Figma export with a bitmap inside it and so goes soft above 512 px. The
 * wordmark lockup still comes from `public/images/brand/logo.svg`, whose bitmap
 * is wide enough for the sizes written here.
 *
 * Outputs land in `assets/brand/` and are not served: nothing in the app links
 * to them, they exist to be uploaded by hand. Commit the output. This does not
 * run on Vercel or in CI.
 */
import { mkdir, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp, { type Sharp } from "sharp";

const LOCKUP = path.join("public", "images", "brand", "logo.svg");
const OUT_DIR = path.join("assets", "brand");

const ORANGE = "#FFB500";
const INK = "#000000";
const WHITE = "#FFFFFF";

/**
 * The mark in the 512-unit space of `icon-512.png`. Centre, radii and the
 * handle axis are measured from that file, so the vector lands on the bitmap.
 */
const RING = { cx: 232, cy: 233, radius: 130.25, stroke: 46.5 };
/** A hair over the ring's inner edge (107), so no seam shows between them. */
const LENS_RADIUS = 108;
const HANDLE = { x1: 314.4, y1: 333.9, x2: 420, y2: 440 };
const QR = { x: 160, y: 161, span: 147, modules: 13 };

/** 13x13, read off the bitmap: four corner brackets, three finders, a checker. */
const QR_GRID = [
	"###.......###",
	"#...........#",
	"#.####.####.#",
	"..#..#.#..#..",
	"..#..#.#..#..",
	"..####.####..",
	".............",
	"..####.#.#...",
	"..#..#..#.#..",
	"..#..#.#.#...",
	"#.####..#.#.#",
	"#...........#",
	"###.......###",
];

/** Tight bounds of the drawn mark, ring edge to handle cap, in the same space. */
const MARK_BOX = {
	x: RING.cx - RING.radius - RING.stroke / 2,
	y: RING.cy - RING.radius - RING.stroke / 2,
	width:
		HANDLE.x2 + RING.stroke / 2 - (RING.cx - RING.radius - RING.stroke / 2),
	height:
		HANDLE.y2 + RING.stroke / 2 - (RING.cy - RING.radius - RING.stroke / 2),
};

function qrPath(): string {
	const module = QR.span / QR.modules;
	const rects: string[] = [];
	QR_GRID.forEach((row, r) => {
		[...row].forEach((cell, c) => {
			if (cell !== "#") return;
			const x = QR.x + c * module;
			const y = QR.y + r * module;
			rects.push(
				`M${x.toFixed(3)} ${y.toFixed(3)}h${module.toFixed(3)}v${module.toFixed(3)}h-${module.toFixed(3)}z`,
			);
		});
	});
	return rects.join("");
}

/** The mark drawn in the 512-unit space; the caller positions it. */
function markBody(): string {
	return [
		`<circle cx="${RING.cx}" cy="${RING.cy}" r="${LENS_RADIUS}" fill="${WHITE}"/>`,
		`<g stroke="${ORANGE}" stroke-width="${RING.stroke}" fill="none" stroke-linecap="round">`,
		`<circle cx="${RING.cx}" cy="${RING.cy}" r="${RING.radius}"/>`,
		`<path d="M${HANDLE.x1} ${HANDLE.y1}L${HANDLE.x2} ${HANDLE.y2}"/>`,
		`</g>`,
		`<path d="${qrPath()}" fill="${INK}" shape-rendering="crispEdges"/>`,
	].join("");
}

/** Standalone, tightly cropped vector of the mark, for designers and favicons. */
function markSvg(): string {
	const { x, y, width, height } = MARK_BOX;
	return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${x} ${y} ${width} ${height}" width="${width}" height="${height}">${markBody()}</svg>`;
}

/** The mark centred on `size`, filling `fill` of it, as a ready-to-raster SVG. */
function squareSvg(size: number, fill: number): string {
	const scale = (size * fill) / MARK_BOX.height;
	const tx = (size - MARK_BOX.width * scale) / 2 - MARK_BOX.x * scale;
	const ty = (size - MARK_BOX.height * scale) / 2 - MARK_BOX.y * scale;
	return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}"><g transform="translate(${tx.toFixed(4)} ${ty.toFixed(4)}) scale(${scale.toFixed(6)})">${markBody()}</g></svg>`;
}

async function write(file: string, image: Sharp) {
	const out = path.join(OUT_DIR, file);
	const buffer = await image.png({ compressionLevel: 9 }).toBuffer();
	await writeFile(out, buffer);
	const { width, height } = await sharp(buffer).metadata();
	const { size } = await stat(out);
	console.log(
		`  ${file.padEnd(39)} ${width}x${height}  ${Math.round(size / 1024)} KB`,
	);
}

async function main() {
	await mkdir(OUT_DIR, { recursive: true });

	await writeFile(path.join(OUT_DIR, "mark.svg"), markSvg());
	console.log(`  ${"mark.svg".padEnd(39)} vector source`);

	// Square (1:1). The mark keeps the 75% of the canvas it has in icon-512.png,
	// but centred, which that file is not.
	const square = Buffer.from(squareSvg(1200, 0.75));
	await write(
		"logo-square-1200.png",
		sharp(square).flatten({ background: WHITE }),
	);
	await write("logo-square-1200-transparent.png", sharp(square));

	// Landscape (4:1). The lockup is ~3.4:1, so height is what constrains it.
	const lockup = await sharp(LOCKUP, { density: 600 })
		.trim({ threshold: 5 })
		.resize({ height: 228, fit: "inside", kernel: "lanczos3" })
		.png()
		.toBuffer();
	const { width: lw = 0, height: lh = 0 } = await sharp(lockup).metadata();
	const landscape = () =>
		sharp({
			create: {
				width: 1200,
				height: 300,
				channels: 4,
				background: { r: 0, g: 0, b: 0, alpha: 0 },
			},
		}).composite([
			{
				input: lockup,
				left: Math.round((1200 - lw) / 2),
				top: Math.round((300 - lh) / 2),
			},
		]);
	await write(
		"logo-landscape-1200x300.png",
		landscape().flatten({ background: WHITE }),
	);
	await write("logo-landscape-1200x300-transparent.png", landscape());
}

main().catch((error) => {
	console.error(error);
	process.exit(1);
});
