import { users } from "@/drizzle/schema";
import { layouts, themes } from "@quicktalog/common";
import { InferSelectModel, Update } from "drizzle-orm";

type Item = {
	key: string;
	label: string;
	image: string;
	description: string;
};

export type Theme = Item;
export type Layout = Item;

export type ThemeVariant = (typeof themes)[number]["key"];
export type LayoutVariant = (typeof layouts)[number]["key"];

export type OverallAnalytics = {
	totalPageViews: number;
	totalUniqueVisitors: number;
	totalServiceCatalogues: number;
	totalNewsletterSubscriptions: number;
};

export type Analytics = {
	date: string;
	current_url: string;
	pageview_count: number;
	unique_visitors: number;
};

export type CookiePreferences = {
	accepted: boolean;
	essential: boolean;
	analytics: boolean;
	marketing: boolean;
	timestamp: string;
	version: string;
};

type RawUser = InferSelectModel<typeof users>;

export type User = Update<
	RawUser,
	{
		cookiePreferences: CookiePreferences;
	}
>;

export type OCRImageData = {
	id: string;
	file: File;
	originalUrl: string;
	confidence?: number;
	isProcessed: boolean;
};

export interface LanguageOption {
	code: string;
	name: string;
	flag: string;
}

export type ContactData = {
	message: string;
	email: string;
	name: string;
	subject: string;
};

export type Currency = {
	value: string;
	label: string;
	symbol: string;
	locale: string;
};

export type AreLimitesReached = {
	catalogues: boolean;
	ocr: boolean;
	prompts: boolean;
};
