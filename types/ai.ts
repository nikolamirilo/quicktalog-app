import type { ContentLayout, FontSize, ShadowLevel } from "@quicktalog/common";

export interface AiActionResult<T> {
	success: boolean;
	data?: T;
	error?: string;
	code?: "unauthorized" | "not_found" | "limit" | "ai_error";
}

export interface GeneratedItem {
	name: string;
	description: string;
	price: number;
	isFree: boolean;
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
	name: string;
	description?: string;
	price?: number;
	isFree?: boolean;
	denominator?: string;
	/**
	 * Photo search term the model chose. The server resolves it to a real URL in
	 * `image` and strips this field before the operation reaches the client, so
	 * the model never has to invent an image URL.
	 */
	imageQuery?: string;
	image?: string;
}

export interface AiCatalogueFields {
	heading?: string;
	currency?: string;
	language?: string;
	businessType?: string;
	metadata?: { title?: string; description?: string };
	contact?: { phone?: string; email?: string; website?: string };
	legal?: { legalName?: string; address?: string };
}

export interface AiAppearanceFields {
	theme?: string;
	fontFamily?: string;
	contentFontSize?: FontSize;
	borderRadius?: number;
	shadow?: ShadowLevel;
}

/**
 * A single edit the chat assistant wants to make to the catalogue.
 *
 * The model addresses sections/items by their position in the snapshot it was
 * given; the server resolves those positions to stable ids before the ops
 * reach the client, so applying a batch is order-independent.
 */
export type CatalogueOperation =
	| {
			op: "add_section";
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
			imageQuery?: string;
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
	| { op: "update_appearance"; fields: AiAppearanceFields };

/** One assistant turn: what it said plus the edits it wants applied. */
export interface CatalogueChatTurn {
	reply: string;
	operations: CatalogueOperation[];
}

export interface CatalogueChatHistoryMessage {
	role: "user" | "assistant";
	content: string;
}

export interface CatalogueChatMessage extends CatalogueChatHistoryMessage {
	id: string;
	/** Human-readable summary of the edits this turn applied. */
	changes?: string[];
	/** Edits that were dropped (bad reference, plan limit reached). */
	skipped?: string[];
}
