/**
 * Builds the home hero's served images from `assets/marketing/hero-source.png`.
 *
 * The source is 3152x2987 and 5.6 MB, of which roughly a third is transparent
 * padding, and it is shown at most 760 CSS px wide. `images.unoptimized` is on
 * for every non-localhost environment, so nothing resizes it at request time:
 * the widths and formats a browser can choose from have to exist as files.
 *
 * Trimming is what makes the declared aspect ratio match what loads, so the
 * reserved box is the right shape and the hero does not shift as it arrives.
 *
 *   npm run images:hero
 *
 * Commit the output. This does not run on Vercel or in CI.
 */
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const SOURCE = path.join("assets", "marketing", "hero-source.png");
const OUT_DIR = path.join("public", "images", "marketing");
const WIDTHS = [760, 1100, 1520] as const;

/** Quality per format, chosen so 1520w stays comfortably inside ~120 KB. */
const AVIF_QUALITY = 55;
const WEBP_QUALITY = 80;

async function main() {
	const trimmed = await sharp(SOURCE)
		// threshold 1: the padding is fully transparent, the artwork is not.
		.trim({ threshold: 1 })
		.toBuffer({ resolveWithObject: true });

	const { width, height } = trimmed.info;
	console.log(`source   ${SOURCE}`);
	console.log(
		`trimmed  ${width}x${height} (ratio ${(width / height).toFixed(3)})`,
	);
	console.log(
		"Set these as the hero's width/height so the reserved box matches.\n",
	);

	await mkdir(OUT_DIR, { recursive: true });

	for (const w of WIDTHS) {
		const resized = sharp(trimmed.data).resize({ width: w });
		const [avif, webp] = await Promise.all([
			resized.clone().avif({ quality: AVIF_QUALITY }).toBuffer(),
			resized.clone().webp({ quality: WEBP_QUALITY }).toBuffer(),
		]);
		await Promise.all([
			writeFile(path.join(OUT_DIR, `hero-${w}.avif`), avif),
			writeFile(path.join(OUT_DIR, `hero-${w}.webp`), webp),
		]);
		const kb = (b: Buffer) => `${(b.length / 1024).toFixed(0)} KB`;
		console.log(`${w}w  avif ${kb(avif)}  webp ${kb(webp)}`);
	}
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
