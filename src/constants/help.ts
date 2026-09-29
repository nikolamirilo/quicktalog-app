import type { IFAQCategory } from "@/types/shared";

/** Help Center topic chips, in display order. */
export const helpCategoryLabels: Record<IFAQCategory, string> = {
	basics: "Basics",
	start: "Getting started",
	edit: "Editing & sharing",
	analytics: "Analytics",
	billing: "Plans & billing",
	support: "Security & support",
};

/** One-tap searches offered under the Help Center search box. */
export const helpPopularSearches = [
	{ label: "QR code", query: "QR code" },
	{ label: "Free plan", query: "free plan" },
	{ label: "AI features", query: "AI features" },
	{ label: "Analytics", query: "analytics" },
];
