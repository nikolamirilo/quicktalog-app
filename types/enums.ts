export type LimitType =
	| "ai"
	| "ocr"
	| "catalogue"
	| "traffic"
	| "items"
	| "categories"
	| "notFound";
export type Status =
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
	| "custom_code"
	| "text";
export type ThemeType = "standard" | "custom";
export type FontSize = "small" | "medium" | "large";
export type FontFamily = "mono" | "serif" | "arial" | "monospace";
export type AnimationLevel = "none" | "minimal" | "medium" | "full";
export type ShadowLevel = "none" | "low" | "medium" | "high";
export type ContentLayout =
	| "variant_1"
	| "variant_2"
	| "variant_3"
	| "variant_4";
