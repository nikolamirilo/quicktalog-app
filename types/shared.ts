import {
	Catalogue,
	ContentBlock,
	Item,
	OverallAnalytics,
	PricingPlan,
	Usage,
	User,
	UserData,
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

export type ITestimonial = {
	name: string;
	role: string;
	message: string;
	avatar: string;
	industry?: string;
	metric?: string;
};

export type CookiePreferencesModalProps = {
	isOpen: boolean;
	onClose: () => void;
	onSave?: () => void;
};

export type IStats = {
	title: string;
	icon: JSX.Element;
	description: string;
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

export type ThemeSelectProps = {
	formData: {
		name: string;
		theme?: string;
		heading?: string;
		currency?: string;
		description?: string;
		language?: string;
		businessType?: string;
	};
	setFormData: React.Dispatch<React.SetStateAction<any>>;
	errors?: { [key: string]: string };
	touched?: { [key: string]: boolean };
	infoButtonComponent?: JSX.Element;
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

export type BuilderProps = {
	type: "create" | "edit";
	initialData?: any;
	onSuccess?: (restaurantUrl: string) => void;
	userData: UserData;
};

export type GeneralInformationInputProps = {
	formData: {
		name: string;
		theme?: string;
		heading?: string;
		currency?: string;
		description?: string;
		language?: string;
		businessType?: string;
	};
	handleInputChange: (
		e:
			| React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
			| { target: { name: string; value: string } },
	) => void;
	setFormData: React.Dispatch<React.SetStateAction<any>>;
	errors?: { [key: string]: string };
	touched?: { [key: string]: boolean };
	setTouched: any;
	setErrors: any;
	type: "create" | "edit";
	handleBlur?: (fieldName: string) => void;
};

export type PromptExamplesProps = {
	setPrompt: (prompt: string) => void;
	disabled?: boolean;
};

export type LanguageSelectorProps = {
	selectedLanguage: string;
	detectedLanguage?: string;
	onLanguageChange: (language: string) => void;
	type?: string;
	errors?: { [key: string]: string };
	touched?: { [key: string]: boolean };
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
