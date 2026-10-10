import { Item } from "@quicktalog/common";

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

export type IFAQCategory =
	| "basics"
	| "start"
	| "edit"
	| "analytics"
	| "billing"
	| "support";

export type IFAQ = {
	question: string;
	answer: string;
	/** Topic used by the Help Center filter chips. */
	category?: IFAQCategory;
};

export type ILinkItem = {
	text: string;
	url: string;
};

export type GaugeStatus = "normal" | "warning" | "critical";

export type NewsletterSubscriber = {
	id: string;
	email: string;
	catalogueName: string | null;
	catalogueId: string;
	createdAt: string;
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
