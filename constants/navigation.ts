import { NavIcon, NavMenu } from "@/types/components";
import { ILinkItem } from "@/types/shared";
import { FaRegCirclePlay } from "react-icons/fa6";
import {
	FiBell,
	FiBookOpen,
	FiBox,
	FiFileText,
	FiHelpCircle,
	FiHome,
	FiTag,
	FiTrendingUp,
} from "react-icons/fi";
import { LuLayoutDashboard } from "react-icons/lu";
import { PiFilesDuotone } from "react-icons/pi";

/** Desktop and mobile navigation render from these, so the two stay in sync. */
export const navMenus: NavMenu[] = [
	{
		label: "Product",
		icon: FiBox,
		items: [
			{
				text: "Live demo",
				url: "/demo",
				description: "Open a real catalogue and click through it",
				icon: FaRegCirclePlay,
			},
			{
				text: "Showcases",
				url: "/showcases",
				description:
					"Menus, service lists and product catalogues people published",
				icon: LuLayoutDashboard,
			},
			{
				text: "How it works",
				url: "/#how-it-works",
				description: "Sign-up to shared QR code, in four steps",
				icon: FiTrendingUp,
			},
		],
	},
	{
		label: "Resources",
		icon: FiBookOpen,
		items: [
			{
				text: "Docs",
				url: "/docs",
				description: "Step-by-step guides, from first catalogue to analytics",
				icon: PiFilesDuotone,
			},
			{
				text: "Articles",
				url: "/articles",
				description: "QR menus, AI catalogues, digital vs. printed",
				icon: FiFileText,
			},
			{
				text: "Help Center",
				url: "/help",
				description: "FAQs and quick answers",
				icon: FiHelpCircle,
			},
			{
				text: "Release Notes",
				url: "/release-notes",
				description: "What's new, improved and fixed",
				icon: FiBell,
			},
		],
	},
];

/** Top-level links shown next to the menus. */
export const navLinks: (ILinkItem & { icon: NavIcon })[] = [
	{ text: "Pricing", url: "/pricing", icon: FiTag },
];

/** The logo covers this on desktop; the mobile drawer hides the logo behind it. */
export const mobileHomeLink: ILinkItem & { icon: NavIcon } = {
	text: "Home",
	url: "/",
	icon: FiHome,
};
