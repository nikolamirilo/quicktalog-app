import {
	BarChart3,
	BookMarked,
	CreditCard,
	LayoutGrid,
	Palette,
	PencilRuler,
	Rocket,
	Share2,
	Sparkles,
} from "lucide-react";

import type { ManualGroup } from "./_types";

/** The modules in the sidebar, in the order a reader meets them. */
export const manualGroups: ManualGroup[] = [
	{
		blurb: "What Quicktalog does, and your first live catalogue.",
		icon: Rocket,
		id: "get-started",
		title: "Get started",
	},
	{
		blurb: "Create catalogues and keep track of the ones you have.",
		icon: LayoutGrid,
		id: "catalogues",
		title: "Your catalogues",
	},
	{
		blurb: "Add sections and items, and edit them in the builder.",
		icon: PencilRuler,
		id: "builder",
		title: "Build a catalogue",
	},
	{
		blurb: "Let the assistant draft and change a catalogue for you.",
		icon: Sparkles,
		id: "assistant",
		title: "Quick AI",
	},
	{
		blurb: "Themes, colours, fonts and the look of your page.",
		icon: Palette,
		id: "design",
		title: "Design",
	},
	{
		blurb: "Publish, share a link and print a QR code.",
		icon: Share2,
		id: "share",
		title: "Share and publish",
	},
	{
		blurb: "See how many people opened your catalogue.",
		icon: BarChart3,
		id: "insights",
		title: "Results",
	},
	{
		blurb: "Your details, your plan and your invoices.",
		icon: CreditCard,
		id: "account",
		title: "Account and plans",
	},
	{
		blurb: "Every limit, every message, and what the words mean.",
		icon: BookMarked,
		id: "reference",
		title: "Reference",
	},
];
