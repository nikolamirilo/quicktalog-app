import { resolveBusinessType } from "@quicktalog/common";
import { headingText } from "@/lib/catalogue/heading";

/** A new catalogue opens the chat; below this width it stays a highlighted button. */
export const QUICK_AI_DESKTOP_MIN_WIDTH = 768;

/** Remembers that the phone hint has been shown, so it is a one-time nudge. */
export const QUICK_AI_HINT_KEY = "qt-quick-ai-hint";

/** What a section of this kind of business is usually called, for the prompt. */
const UNIT: Record<string, string> = {
	"food-beverage": "menu",
	"beauty-wellness": "treatment list",
	"health-fitness": "class and session list",
	retail: "product catalogue",
	"professional-services": "service list",
	"home-trades": "service list",
	"events-hospitality": "package list",
	"education-training": "course list",
	automotive: "service list",
	"real-estate": "listing",
};

/**
 * The prompt a new catalogue opens with, so the owner can press send rather than work
 * out what to ask for. It names the business, its kind and the currency, which is what
 * the agent otherwise has to ask for first.
 */
export function startingPrompt(catalogue: {
	name?: string;
	heading?: string;
	businessType?: string;
	currency?: string;
}): string {
	const business =
		headingText(catalogue.heading) || catalogue.name?.trim() || "my business";
	const type = resolveBusinessType(catalogue.businessType);
	const unit = (type && UNIT[type.value]) || "catalogue";
	const kind = type && type.value !== "other" ? ` (${type.label})` : "";
	const currency = catalogue.currency
		? ` Prices in ${catalogue.currency}.`
		: "";

	return `Build a ${unit} for ${business}${kind}: 4 sections with 5 items each, with a short description and a price for every item.${currency}`;
}

export type EmptyStateSuggestion = {
	id: "describe" | "photo" | "template";
	label: string;
	hint: string;
};

/**
 * What an empty catalogue offers instead of "Raise every price by 10%". All three
 * create content; the old suggestions all assumed there was already some.
 */
export const EMPTY_STATE_SUGGESTIONS: EmptyStateSuggestion[] = [
	{
		id: "describe",
		label: "Build it from a description",
		hint: "Tell Quick AI about your business and it writes the sections and items",
	},
	{
		id: "photo",
		label: "Import from a photo of my menu",
		hint: "Attach a photo or screenshot and it reads the items and prices",
	},
	{
		id: "template",
		label: "Start from a template",
		hint: "Pick a ready-made layout and edit it",
	},
];
