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
 *
 * Everything shipped before Builder 2.0 is collapsed into a single `v1.0`
 * entry. From v2 on, each release bumps the minor (`v2.1`, `v2.2`, ...)
 * regardless of package.json, so a new entry takes the previous entry's
 * version plus one.
 */
export const releaseNotes: ReleaseNote[] = [
	{
		slug: "builder-2-0",
		version: "v2.0",
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
		slug: "quicktalog-launches",
		version: "v1.0",
		date: "2025-11-01",
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
				tag: "New",
				text: "Built-in QR code editor for sharing a catalogue in print or in-store.",
			},
			{ tag: "New", text: "Live chat support widget." },
			{
				tag: "Improved",
				text: "Faster image uploads and a redesigned builder flow with a live preview.",
			},
			{
				tag: "Improved",
				text: "Smoother plan upgrades and cancellations, with confirmation emails.",
			},
			{ tag: "Fixed", text: "Analytics reporting inaccuracies." },
		],
	},
];
