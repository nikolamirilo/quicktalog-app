import { layouts, themes } from "@quicktalog/common";

/** Hexus product tour shown on /demo. */
export const TOUR_URL =
	"https://app.usehexus.com/embed/254bfe62-3496-414e-93e8-5447b8fa54a9";

/** Published catalogues shown on /showcases, in display order. */
export const showcaseUrls = [
	"https://www.quicktalog.app/catalogues/entre-fuego-y-tierra",
	"https://www.quicktalog.app/catalogues/topclass-collections",
	"https://www.quicktalog.app/catalogues/m-motors-taller-y-venta-de-sensores",
	"https://www.quicktalog.app/catalogues/montre-shop",
	"https://www.quicktalog.app/catalogues/electronic-sale",
	"https://www.quicktalog.app/catalogues/watches-established-stock-catalog",
	"https://www.quicktalog.app/catalogues/gonvitech",
];

export type ShowcaseItem = { src: string; title: string };

/** "…/catalogues/montre-shop" → "Montre Shop". */
const titleFromUrl = (src: string) =>
	(src.split("/").pop() ?? "")
		.split("-")
		.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
		.join(" ");

export const showcases: ShowcaseItem[] = showcaseUrls.map((src) => ({
	src,
	title: titleFromUrl(src),
}));

/** Example prompts typed out in the home "Let AI do the work" card. */
export const aiPrompts = {
	cafe: {
		label: "Café",
		text: "A cosy neighbourhood café with specialty coffee, weekend brunch and cakes baked in-house.",
	},
	salon: {
		label: "Hair salon",
		text: "Hair and beauty salon: cuts, colour, blow-dry, gel nails and facials, with prices per service.",
	},
	shop: {
		label: "Boutique",
		text: "Small boutique selling candles, linen, watches and gifts, with new arrivals every month.",
	},
	fix: {
		label: "Bike repair",
		text: "Bike repair workshop: tune-ups, flat fixes, brake service and second-hand bikes for sale.",
	},
} as const;

export type AiPromptKey = keyof typeof aiPrompts;
export const aiPromptKeys = Object.keys(aiPrompts) as AiPromptKey[];

export const aiSteps = ["Describe", "AI drafts", "You edit & publish"];

/** Illustration inside each "With Quicktalog" card of the problem section. */
export type ProblemPreviewKind = "template" | "price" | "share";

export type Problem = {
	topic: string;
	title: string;
	before: { text: string; points: string[] };
	after: { text: string; points: string[] };
	preview: ProblemPreviewKind;
};

export const problems: Problem[] = [
	{
		topic: "01 · Design",
		title: "Designing a catalog shouldn't need a designer",
		before: {
			text: "You hire a designer or fight complex software, and still end up with a plain PDF.",
			points: [
				"Designer fees",
				"Hours in design tools",
				"Plain, hard-to-read PDF",
			],
		},
		after: {
			text: "Pick a template, add your items, and publish a professional catalog yourself.",
			points: [
				`${themes.length} designer themes × ${layouts.length} layouts`,
				"No design or code skills",
				"Or let AI draft it for you",
			],
		},
		preview: "template",
	},
	{
		topic: "02 · Updates",
		title: "Printed prices go stale the day you print them",
		before: {
			text: "A price changes, an item sells out, and customers keep reading the old version.",
			points: [
				"Wrong prices on the table",
				"Reprint for every change",
				"Confused customers",
			],
		},
		after: {
			text: "Edit from your phone and publish. Everyone sees the new version, with no reprinting.",
			points: [
				"Update from any device",
				"Same link and QR, always current",
				"Changes go live instantly",
			],
		},
		preview: "price",
	},
	{
		topic: "03 · Sharing",
		title: "Paper catalogs cost money and tell you nothing",
		before: {
			text: "Printing and handing out catalogs is expensive, they get lost, and you never know who looked.",
			points: [
				"Printing and delivery costs",
				"Lost or thrown away",
				"No idea who's interested",
			],
		},
		after: {
			text: "Share one link or QR code anywhere, and see how many people open your catalog.",
			points: [
				"Link, QR code or website embed",
				"Styled QR code on every plan",
				"Views and visitors per day",
			],
		},
		preview: "share",
	},
];

/** Reassurance lines repeated under sign-up buttons. */
export const signupAssurances = [
	"No credit card required",
	"Start with our free plan",
];
