import {
	Catalogue,
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

export type HeadingSize = "extraLarge" | "large" | "medium" | "small";

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

export type GaugeStatus = "normal" | "warning" | "critical";

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
