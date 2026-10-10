import type { NavIcon, NavMenu } from "@/types/navigation";
import { legalDocuments } from "@/constants/legal";
import type { ILinkItem } from "@/types/shared";
import {
	Bell,
	BookOpen,
	CirclePlay,
	FileText,
	HelpCircle,
	House,
	LayoutTemplate,
	Tag,
	TrendingUp,
} from "lucide-react";

/** Desktop dropdowns and the mobile sheet render from these, so the two stay in sync. */
export const navMenus: NavMenu[] = [
	{
		label: "Product",
		items: [
			{
				text: "Live demo",
				url: "/demo",
				description: "Open a real catalogue and click through it",
				icon: CirclePlay,
			},
			{
				text: "Showcases",
				url: "/showcases",
				description:
					"Menus, service lists and product catalogues people published",
				icon: LayoutTemplate,
			},
			{
				text: "How it works",
				url: "/#how-it-works",
				description: "Sign-up to shared QR code, in four steps",
				icon: TrendingUp,
			},
		],
	},
	{
		label: "Resources",
		items: [
			{
				text: "Docs",
				url: "/docs",
				description: "Step-by-step guides, from first catalogue to analytics",
				icon: BookOpen,
			},
			{
				text: "Articles",
				url: "/articles",
				description: "QR menus, AI catalogues, digital vs. printed",
				icon: FileText,
			},
			{
				text: "Help Center",
				url: "/help",
				description: "FAQs and quick answers",
				icon: HelpCircle,
			},
			{
				text: "Release Notes",
				url: "/release-notes",
				description: "What's new, improved and fixed",
				icon: Bell,
			},
		],
	},
];

/** Top-level links shown next to the menus (the mobile sheet lists them under "More"). */
export const navLinks: (ILinkItem & { icon: NavIcon })[] = [
	{ text: "Pricing", url: "/pricing", icon: Tag },
];

/** The logo covers this on desktop; the mobile sheet lists it first. */
export const mobileHomeLink: ILinkItem & { icon: NavIcon } = {
	text: "Home",
	url: "/",
	icon: House,
};

export const authLinks = {
	login: "/auth",
	signup: "/auth?mode=signup",
	dashboard: "/admin/dashboard",
} as const;

/** Footer link columns. */
export const footerLinkColumns: { title: string; links: ILinkItem[] }[] = [
	{
		title: "Product",
		links: [
			{ text: "Live demo", url: "/demo" },
			{ text: "Showcases", url: "/showcases" },
			{ text: "Pricing", url: "/pricing" },
			{ text: "How it works", url: "/#how-it-works" },
			{ text: "Create a catalogue", url: authLinks.signup },
		],
	},
	{
		title: "Resources",
		links: [
			{ text: "Docs", url: "/docs" },
			{ text: "Articles", url: "/articles" },
			{ text: "Help Center", url: "/help" },
			{ text: "FAQ", url: "/#faq" },
			{ text: "Release Notes", url: "/release-notes" },
		],
	},
];

export const footerContactLink: ILinkItem = {
	text: "Contact us",
	url: "/contact",
};

export const footerLegalLinks: ILinkItem[] = [
	...legalDocuments.map(({ name, href }) => ({ text: name, url: href })),
	{ text: "Sitemap", url: "/sitemap.xml" },
];
