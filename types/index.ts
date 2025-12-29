import { Legal, layouts, Partner, themes } from "@quicktalog/common";
import { ILinkItem, ISocials } from "./components";

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
	email?: string;
	partners?: Partner[];
	phone?: string;
	socials?: string[];
	socialLinks?: ISocials;
	cta?: {
		isEnabled: boolean;
		label: string;
		url: string;
	};
	ctaFooter?: {
		enabled: boolean;
		label: string;
		url: string;
	};
	newsletter?: boolean;
	showPartners?: boolean;
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
