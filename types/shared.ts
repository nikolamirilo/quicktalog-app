import {
	Catalogue,
	ContentBlock,
	Item,
	OverallAnalytics,
	PricingPlan,
	Usage,
	User,
} from "@quicktalog/common";
import { JSX } from "react";

export type DisplayItem = Omit<Item, "price"> & {
	price: string | number;
};

export type TabKey =
	| "general"
	| "templates"
	| "header"
	| "footer"
	| "appearance";

export type HeadingSize = "extraLarge" | "large" | "medium" | "small";

export interface ImageDropzoneProps {
	type?: "default" | "logo" | "qr-editor" | "icon";
	setIsUploading: React.Dispatch<boolean>;
	onUploadComplete: (url: string) => void;
	onError?: (error: Error) => void;
	maxDim?: number;
	targetSizeKB?: number;
	className?: string;
	disabled?: boolean;
	removeImage: () => void;
	image: string;
}

export type CookiePreferencesModalProps = {
	isOpen: boolean;
	onClose: () => void;
	onSave?: () => void;
};

export type ISocials = {
	facebook?: string;
	github?: string;
	instagram?: string;
	linkedin?: string;
	threads?: string;
	tiktok?: string;
	twitter?: string;
	youtube?: string;
	x?: string;
	[key: string]: string | undefined;
};

export type SuccessModalProps = {
	isOpen: boolean;
	onClose: () => void;
	catalogueUrl: string;
	type?: "regular" | "ai" | "edit" | "ocr";
};

export type CatalogueHeaderProps = {
	type?: "default" | "custom";
	logo?: string;
	data?: Catalogue;
};

export type CatalogueFooterProps = {
	type?: "default" | "custom";
	data?: Catalogue;
	logo: string;
};

export type CatalogueContentProps = {
	data: ContentBlock[];
	currency: string;
	type: "demo" | "item";
	theme?: string;
	mode: "edit" | "view";
	onEditBlock?: (index: number) => void;
};

export type IFAQ = {
	question: string;
	answer: string;
};

export type ILinkItem = {
	text: string;
	url: string;
};

export type IBenefit = {
	title: string;
	description: string;
	imageSrc: string;
	bullets: IBenefitBullet[];
};

export type IBenefitBullet = {
	title: string;
	description: string;
	icon: JSX.Element;
};

export type DonutChartProps = {
	data: number[];
	labels: string[];
};

export type CatalogueAnalyticsProps = {
	data: { date: string; count: number }[];
	rawEvents: any[];
};

export type SubscriptionProps = {
	pricingPlan: PricingPlan;
	subscriptionStartDate?: string;
	subscriptionUpdatedDate?: string;
};

export type DashboardProps = {
	user: User;
	catalogues: Catalogue[];
	overallAnalytics: OverallAnalytics;
	usage: Usage;
	pricingPlan: PricingPlan;
};

export type NewsletterSubscriber = {
	id: string;
	email: string;
	catalogueName: string | null;
	catalogueId: string;
	createdAt: string;
};

export type OverviewProps = {
	catalogues: Catalogue[];
	overallAnalytics: OverallAnalytics;
	user: User;
	refreshAll: any;
	usage: Usage;
	planId: number;
	newsletterSubscribers: NewsletterSubscriber[];
};

export type CardProps = {
	record: DisplayItem;
	currency: string;
	onClick: () => void;
	mode?: "view" | "edit";
	onEdit?: () => void;
	onDelete?: () => void;
	onMoveUp?: () => void;
	onMoveDown?: () => void;
	isFirst?: boolean;
	isLast?: boolean;
	blockIndex?: number;
	itemIndex?: number;
};
