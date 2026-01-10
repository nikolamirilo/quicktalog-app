import { catalogues } from "@/drizzle/schema"; // ← your schema file(s)
import { type InferSelectModel } from "drizzle-orm";
import {
	AnimationLevel,
	ContentLayout,
	FontFamily,
	FontSize,
	ShadowLevel,
	Source,
	Status,
	ThemeType,
} from "./enums";
import { Update } from "./functions";

type RawCatalogue = InferSelectModel<typeof catalogues>;

export type Catalogue = Update<
	RawCatalogue,
	{
		status: Status;
		source: Source;
		content: ContentBlock[];
		legal: Legal;
		appearance: Appearance;
		contact: Contact;
		header: Header;
		footer: Footer;
		partners: Partner[];
	}
>;

export interface BaseContentBlock {
	id: string;
	order: number;
}

export interface CategoryBlock extends BaseContentBlock {
	type: "category";
	name: string;
	layout: ContentLayout;
	items: Item[];
	isExpanded: boolean;
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

export interface TextBlock extends BaseContentBlock {
	type: "text";
	content: string;
}

export type ContentBlock =
	| CategoryBlock
	| ContainerBlock
	| IframeBlock
	| CustomCodeBlock
	| TextBlock;

export interface ItemDiscount {
	isOnDiscount: boolean;
	discountPercentage: number;
	discountedPrice: number;
}

export interface Item {
	id: string;
	order: number;
	name: string;
	description: string;
	image: string;
	isFree?: boolean;
	discount?: ItemDiscount;
	price: number;
	denominator?: string;
}

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
