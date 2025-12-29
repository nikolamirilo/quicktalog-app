export type CatalogueStatus =
	| "active"
	| "inactive"
	| "draft"
	| "in preparation"
	| "error";
export type Source = "builder" | "ocr_import" | "ai_prompt";
export type ContentBlockType =
	| "category"
	| "container"
	| "iframe"
	| "custom_code";
export type ThemeType = "standard" | "custom";
export type FontSize = "small" | "medium" | "large";
export type FontFamily = "mono" | "serif" | "arial" | "monospace";
export type AnimationLevel = "none" | "minimal" | "medium" | "full";
export type ShadowLevel = "none" | "low" | "medium" | "high";

export interface BaseContentBlock {
	id: string;
	order: number;
}

export interface CategoryBlock extends BaseContentBlock {
	type: "category";
	name: string;
	layout: ContentLayout;
	items: Item[];
}

export interface ContainerBlock extends BaseContentBlock {
	type: "container";
	name: string;
	layout: ContentLayout;
	items: Item[];
}

export interface IframeBlock extends BaseContentBlock {
	type: "iframe";
	heading?: string;
	src: string;
}
export interface CustomCodeBlock extends BaseContentBlock {
	type: "custom_code";
	code: string;
}

export type ContentBlock =
	| CategoryBlock
	| ContainerBlock
	| IframeBlock
	| CustomCodeBlock;

export interface Catalogue {
	id?: string;
	name: string;
	logo: string;
	status: CatalogueStatus;
	language: string;
	heading: string;
	description: string;
	currency: string;
	business_type: string;
	content: ContentBlock[];
	legal: Legal;
	appearance: Appearance;
	contact: Contact;
	header: Header;
	footer: Footer;
	created_at?: Date;
	created_by?: string;
	updated_at?: Date;
	source: Source;
	tags: string[];
	partners: Partner[];
}

export interface ItemDiscount {
	isOnDiscount: boolean;
	discountPercentage: number;
	discountedPrice: number;
}

export interface Item {
	order: number;
	name: string;
	description: string;
	image: string;
	isFree?: boolean;
	discount?: ItemDiscount;
	price: number;
	denominator?: string;
}

export type ContentLayout =
	| "variant_1"
	| "variant_2"
	| "variant_3"
	| "variant_4";

export interface Legal {
	legalName: string;
	termsAndConditions: string;
	privacyPolicy: string;
	address: string;
}

export interface Appearance {
	theme: {
		type: ThemeType;
		name: string;
	};
	style: {
		contentFontSize: FontSize;
		fontFamily: FontFamily;
		borderRadius: number;
		animation: AnimationLevel;
		shadow: ShadowLevel;
	};
	overlay: {
		isEnabled: boolean;
		icon: string;
	};
}

export interface CTAButton {
	isEnabled: boolean;
	label: string;
	url: string;
}

export interface Partner {
	name: string;
	url: string;
	description: string;
}

export interface Footer {
	cta: CTAButton;
	newsletter: boolean;
	showPartners: boolean;
}

export interface Header {
	cta: CTAButton;
	emailCta: boolean;
	phoneCta: boolean;
}

export interface Contact {
	phone: string;
	email: string;
	socials: string[];
}
