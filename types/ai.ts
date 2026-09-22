import type {
	ContentLayout,
	FontSize,
	OCRImageData,
	ShadowLevel,
} from "@quicktalog/common";

export interface AiActionResult<T> {
	success: boolean;
	data?: T;
	error?: string;
	code?: "unauthorized" | "not_found" | "limit" | "ai_error";
}

/**
 * An image the user attached to a chat turn. OCR runs in the browser, so what
 * reaches the agent is the text pulled out of the picture, never the picture.
 */
export interface ChatScannedImage extends OCRImageData {
	/** Set once the scan finishes and clears the confidence floor. */
	text?: string;
	/** Why this image contributes nothing, phrased for the user. */
	failure?: string;
}

/** Section types the chat assistant is allowed to create. */
export type AiSectionType =
	| "category"
	| "container"
	| "text"
	| "divider"
	| "embedding"
	| "custom_code";

/** Per-plan section unlocks, mirroring `currentPlan.features.sections`. */
export interface AiSectionAccess {
	divider?: boolean;
	embedding?: boolean;
	customCode?: boolean;
}

export interface AiItemInput {
	/**
	 * Minted by the agent so the server's working copy and the browser's draft
	 * agree on ids; the applier falls back to a fresh uuid when it is absent.
	 */
	id?: string;
	name: string;
	description?: string;
	price?: number;
	isFree?: boolean;
	denominator?: string;
	image?: string;
}

interface AiCatalogueFields {
	heading?: string;
	currency?: string;
	language?: string;
	businessType?: string;
	/** Address of an image already uploaded; "" clears it. */
	logo?: string;
	metadata?: { title?: string; description?: string; icon?: string };
	contact?: {
		phone?: string;
		email?: string;
		website?: string;
		/** Replaces the whole list, matching how the Footer tab edits it. */
		socials?: string[];
	};
	legal?: {
		legalName?: string;
		address?: string;
		termsAndConditions?: string;
		privacyPolicy?: string;
	};
}

interface AiCtaFields {
	isEnabled?: boolean;
	label?: string;
	url?: string;
}

/**
 * The builder exposes only the width; height is left as it is, so the two
 * header/footer field shapes flatten `logoSize` to one number.
 */
interface AiHeaderFields {
	type?: "default" | "custom";
	cta?: AiCtaFields;
	phoneCta?: boolean;
	emailCta?: boolean;
	logoWidth?: number;
}

interface AiFooterFields {
	type?: "default" | "custom";
	cta?: AiCtaFields;
	newsletter?: boolean;
	showPartners?: boolean;
	logoWidth?: number;
}

interface AiAppearanceFields {
	theme?: string;
	fontFamily?: string;
	contentFontSize?: FontSize;
	borderRadius?: number;
	shadow?: ShadowLevel;
	/**
	 * Six-colour palette that switches the theme to `theme-custom`. Sent only
	 * when the user asks for a custom look; the standard `theme` field above
	 * still resets the palette to its built-in defaults.
	 */
	customColors?: AiCustomColors;
}

interface AiCustomColors {
	background?: string;
	heading?: string;
	text?: string;
	primary?: string;
	secondary?: string;
	cardBackground?: string;
}

/**
 * A single edit the chat assistant wants to make to the catalogue. The model
 * addresses by position in its snapshot; the server resolves those to stable
 * ids before the ops reach the client, so a batch applies order-independently.
 */
export type CatalogueOperation =
	| {
			op: "add_section";
			/** See `AiItemInput.id`. */
			id?: string;
			sectionType: AiSectionType;
			name?: string;
			layout?: ContentLayout;
			/** Body of a `text` section. */
			content?: string;
			/** Markup of an `embedding` or `custom_code` section. */
			code?: string;
			items?: AiItemInput[];
			position?: number;
	  }
	| {
			op: "update_section";
			sectionId: string;
			name?: string;
			layout?: ContentLayout;
			content?: string;
			code?: string;
			isExpanded?: boolean;
	  }
	| { op: "delete_section"; sectionId: string }
	| { op: "move_section"; sectionId: string; direction: "up" | "down" }
	| { op: "add_items"; sectionId: string; items: AiItemInput[] }
	| {
			op: "update_item";
			sectionId: string;
			itemId: string;
			name?: string;
			description?: string;
			price?: number;
			isFree?: boolean;
			denominator?: string;
			image?: string;
	  }
	| { op: "delete_item"; sectionId: string; itemId: string }
	| {
			op: "move_item";
			sectionId: string;
			itemId: string;
			direction?: "up" | "down";
			toSectionId?: string;
	  }
	| { op: "update_catalogue"; fields: AiCatalogueFields }
	| { op: "update_appearance"; fields: AiAppearanceFields }
	| { op: "update_header"; fields: AiHeaderFields }
	| { op: "update_footer"; fields: AiFooterFields };

/** What every agent tool returns. A failure is not an exception - the model reads `error` and corrects itself within the same turn. */
export type AgentToolResult =
	| {
			ok: true;
			/** Replayed against the builder draft when the tool part resolves. */
			operation: CatalogueOperation;
			summary: string;
			/** Where an added section landed, so the model can add to it next. */
			section?: number;
			/**
			 * Photos that could not be found - an empty search, or a page picture
			 * that does not exist - so the model can say so.
			 */
			imageMisses?: string[];
			/**
			 * Name of the saved theme when setCustomTheme wrote one to the
			 * library, so the model can confirm it to the user.
			 */
			savedTheme?: { name: string };
			/** Why the theme was applied to the catalogue but not saved. */
			saveError?: string;
	  }
	| {
			ok: false;
			error: string;
			/**
			 * The edit was refused by the caller's plan rather than by a bad
			 * reference, so the client knows to offer an upgrade.
			 */
			limitReached?: boolean;
	  };
