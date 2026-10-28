import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

/** The modules in the sidebar, in the order they appear. */
export type ManualGroupId =
	| "get-started"
	| "catalogues"
	| "builder"
	| "assistant"
	| "design"
	| "share"
	| "insights"
	| "account"
	| "reference";

export interface ManualGroup {
	id: ManualGroupId;
	/** Module name in the sidebar. */
	title: string;
	icon: LucideIcon;
	/** One line for the cards on the welcome page. */
	blurb: string;
}

/** One thing the reader needs before the steps on a page will work. */
export interface ManualPrerequisite {
	text: string;
	/** Slug of the manual page that covers it. */
	href?: string;
}

export interface ManualPageMeta {
	/** URL segment under /docs/new. Stable: links use it. */
	slug: string;
	group: ManualGroupId;
	/** Sidebar entry and the page title. */
	title: string;
	/** "In short": what this page helps you do. */
	inShort: string;
	/** "Result": what the reader ends up with. Left out on overview pages. */
	result?: string;
	/** The Where bar: the path through the product to this screen. */
	where?: string[];
	/** "Before you start". */
	before?: ManualPrerequisite[];
	/** Short chips next to the title, such as "Paid plans". */
	badges?: string[];
	/** Extra words for search, beyond the title and "In short". */
	keywords?: string[];
	/** Words readers type that should find this page. */
	synonyms?: string[];
	/** Slugs shown as "Related pages". Falls back to the rest of the module. */
	related?: string[];
	/** Tutorials keep their tick boxes and show progress in the right column. */
	checklist?: boolean;
	/** Troubleshooting pages show their message tables open. */
	openMessages?: boolean;
}

export interface ManualPage {
	meta: ManualPageMeta;
	Body: () => ReactNode;
}
