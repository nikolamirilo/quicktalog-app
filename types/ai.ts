import type { ContentLayout, FontSize, ShadowLevel } from "@quicktalog/common";

export interface AiActionResult<T> {
	success: boolean;
	data?: T;
	error?: string;
	code?: "unauthorized" | "not_found" | "limit" | "ai_error";
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
	| { op: "update_appearance"; fields: AiAppearanceFields };

/**
 * What every agent tool returns. A failure is not an exception: the model reads
 * `error` on its next step and corrects itself within the same turn, which is
 * why a bad section index no longer disappears silently.
 */
export type AgentToolResult =
	| {
			ok: true;
			/** Replayed against the builder draft when the tool part resolves. */
			operation: CatalogueOperation;
			summary: string;
			/** Photo searches that came back empty, so the model can say so. */
			imageMisses?: string[];
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
