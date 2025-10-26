import { Catalogue, Legal, layouts, Partner, themes } from "@quicktalog/common";
import { ILinkItem, ISocials } from "./components";
import { Status } from "./enums";

export type Record = {
	name: string;
	description: string;
	price: number | string;
	image: string;
};
export type CookiePreferences = {
	accepted: boolean;
	essential: boolean;
	analytics: boolean;
	marketing: boolean;
	timestamp: string;
	version: string;
};

export type NavbarProps = {
	itemData?: unknown;
};

export type Theme = {
	key: string;
	label: string;
	image: string;
	description: string;
};

export type Layout = Theme;

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

export type User = {
	id: string;
	email: string | null;
	name: string | null;
	created_at: string;
	image: string | null;
	cookie_preferences?: CookiePreferences | null;
	plan_id: string | null;
	customer_id: string | null;
};

export type OCRImageData = {
	id: string;
	file: File;
	originalUrl: string;
	confidence?: number;
	isProcessed: boolean;
};

export type ContactInfo = {
	type: string;
	value: string;
};

export type Usage = {
	traffic: { pageview_count: number; unique_visitors: number };
	ocr: number;
	prompts: number;
	catalogues: number;
};

export type UserData = User & {
	usage: Usage;
	currentPlan: PricingPlan;
	nextPlan: PricingPlan;
};
export interface LanguageOption {
	code: string;
	name: string;
	flag: string;
}

export interface OcrState {
	result: string;
	selectedImage: File | null;
	processedImageUrl: string;
	status: string;
	confidence: number;
	selectedLanguage: string;
	detectedLanguage: string;
	isSubmitting: boolean;
	serviceCatalogueUrl: string;
	showSuccessModal: boolean;
}

export type PricingPlan = {
	id: number;
	name: string;
	type: string;
	priceId: {
		month: string;
		year: string;
	};
	description: string;
	features: {
		support: string;
		catalogues: number;
		newsletter: boolean;
		custom_features: boolean;
		ocr_ai_import: number;
		traffic_limit: number;
		branding: boolean;
		analytics: string;
		ai_prompts: number;
		categories_per_catalogue?: number | "unlimited";
		items_per_catalogue?: number | "unlimited";
	};
	billing_period?: "month" | "year";
};

export type ContactData = {
	message: string;
	email: string;
	name: string;
	subject: string;
};

export type ContactItem = {
	type: string;
	value: string;
};

export type HeaderData = {
	email: string;
	phone: string;
	ctaNavbar?: any;
};

export type FooterData = {
	name: string;
	email?: string;
	partners?: Partner[];
	phone?: string;
	socialLinks: {
		instagram?: string;
		facebook?: string;
		twitter?: string;
		website?: string;
		linkedin?: string;
		youtube?: string;
		github?: string;
		x?: string;
		threads?: string;
		tiktok?: string;
	};
	ctaFooter?: {
		enabled: boolean;
		label: string;
		url: string;
	};
	newsletter?: {
		enabled: boolean;
	};
	legal?: Legal;
	catalogue?: {
		id?: string;
		owner_id?: string;
	};
};

export type FooterDetails = {
	subheading: string;
	quickLinks: ILinkItem[];
	email: string;
	telephone: string;
	socials: ISocials;
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
