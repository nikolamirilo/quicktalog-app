export type ReleaseNoteTag = "New" | "Improved" | "Fixed";

export type ReleaseNoteItem = {
	tag: ReleaseNoteTag;
	text: string;
};

export type ReleaseNote = {
	slug: string;
	version: string;
	date: string;
	title: string;
	items: ReleaseNoteItem[];
};

/**
 * Newest first. `date` drives both the displayed month and the sidebar order.
 * Grouped by what actually merged into `main` and went live, not by when work
 * landed on `test` - months of `test`-only work can ship as one release.
 * `version` mirrors package.json's real version at the time of each release
 * (see git history on package.json), not an invented number, so a new entry
 * can be appended straight from the current package.json version.
 */
export const releaseNotes: ReleaseNote[] = [
	{
		slug: "builder-2-0",
		version: "v2.1.0",
		date: "2026-05-01",
		title: "Builder 2.0",
		items: [
			{
				tag: "New",
				text: "Rebuilt the catalogue builder around content blocks: text, images, dividers, and custom embeds, arranged however you like instead of fixed sections.",
			},
			{
				tag: "New",
				text: "Ready-made templates to start a catalogue faster.",
			},
			{
				tag: "New",
				text: "A public showcases gallery, browse real catalogues built with Quicktalog.",
			},
			{
				tag: "New",
				text: "Independent header and footer customization.",
			},
			{
				tag: "Improved",
				text: "New catalogue themes and a refreshed look across cards, footer, and mobile.",
			},
			{ tag: "Improved", text: "Simplified pricing plans." },
			{
				tag: "Fixed",
				text: "A wide range of UI and mobile issues found during testing, including iOS-specific bugs.",
			},
		],
	},
	{
		slug: "qr-codes-and-live-chat",
		version: "v1.1.2",
		date: "2025-11-01",
		title: "QR codes and live chat",
		items: [
			{
				tag: "New",
				text: "Built-in QR code editor for sharing a catalogue in print or in-store.",
			},
			{ tag: "New", text: "Live chat support widget." },
			{
				tag: "Improved",
				text: "Smoother plan upgrades and cancellations, with confirmation emails.",
			},
			{ tag: "Fixed", text: "Analytics reporting inaccuracies." },
		],
	},
	{
		slug: "faster-builder-smarter-imports",
		version: "v1.1.2",
		date: "2025-10-01",
		title: "Faster builder, smarter imports",
		items: [
			{
				tag: "New",
				text: "Generate catalogue content with AI, or import an existing menu with OCR.",
			},
			{
				tag: "New",
				text: "Duplicate an existing catalogue to start a new one faster.",
			},
			{ tag: "New", text: "Rich text formatting for item descriptions." },
			{
				tag: "Improved",
				text: "Faster image uploads and a redesigned builder flow with a live preview.",
			},
		],
	},
	{
		slug: "quicktalog-launches",
		version: "v0.1.0",
		date: "2025-09-01",
		title: "Quicktalog launches",
		items: [
			{
				tag: "New",
				text: "A guided, multi-step builder: categories, items, branding, and appearance in one flow.",
			},
			{ tag: "New", text: "A detail view for every item, with image zoom." },
			{
				tag: "New",
				text: "Paid plans with subscription billing, and usage limits by plan.",
			},
			{
				tag: "New",
				text: "An analytics dashboard for every catalogue.",
			},
		],
	},
];
