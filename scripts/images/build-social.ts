/**
 * Builds the Open Graph and Twitter cards from the same hero artwork the home
 * page serves, so a shared link shows the product the site shows.
 *
 * Each card is a white canvas with two pieces on it: the wordmark-and-headline
 * block (`assets/marketing/social-text.png`, lifted from the cards that were
 * drawn by hand, so the typography stays exactly as designed) on the left, and
 * the trimmed hero on the right. Only the hero changes when the artwork does.
 *
 *   npm run images:social
 *
 * Commit the output. This does not run on Vercel or in CI.
 */
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const HERO_SOURCE = path.join("assets", "marketing", "hero-source.png");
const TEXT_BLOCK = path.join("assets", "marketing", "social-text.png");
const OUT_DIR = path.join("public", "images", "brand");

interface Card {
	file: string;
	width: number;
	height: number;
	/** Left edge of the text block; it is centred vertically, as the hero is. */
	textLeft: number;
	/** Horizontal band the hero is centred in, between the text and the edge. */
	hero: { left: number; width: number };
}

const CARDS: Card[] = [
	{
		file: "opengraph-image.png",
		width: 1200,
		height: 630,
		textLeft: 74,
		hero: { left: 730, width: 455 },
	},
	{
		file: "twitter-image.png",
		width: 1200,
		height: 600,
		textLeft: 99,
		hero: { left: 755, width: 425 },
	},
];

async function main() {
	const text = await sharp(TEXT_BLOCK).toBuffer({ resolveWithObject: true });

	const trimmed = await sharp(HERO_SOURCE)
		// threshold 1: the padding is fully transparent, the artwork is not.
		.trim({ threshold: 1 })
		.toBuffer();

	await mkdir(OUT_DIR, { recursive: true });

	for (const card of CARDS) {
		const hero = await sharp(trimmed)
			.resize({ width: card.hero.width })
			.toBuffer({ resolveWithObject: true });

		const out = await sharp({
			create: {
				width: card.width,
				height: card.height,
				channels: 4,
				background: "#ffffff",
			},
		})
			.composite([
				{
					input: text.data,
					left: card.textLeft,
					top: Math.round((card.height - text.info.height) / 2),
				},
				{
					input: hero.data,
					left: card.hero.left,
					top: Math.round((card.height - hero.info.height) / 2),
				},
			])
			.png()
			.toBuffer();

		await writeFile(path.join(OUT_DIR, card.file), out);
		console.log(`${card.file}  ${(out.length / 1024).toFixed(0)} KB`);
	}
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
