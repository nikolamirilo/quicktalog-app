import { countPlanItems } from "@/lib/catalogue/content-blocks";
import type { OperationLimits } from "@/lib/catalogue/operations";
import type { tiers } from "@quicktalog/common";

type TierFeatures = (typeof tiers)[number]["features"];

/**
 * The one place a plan becomes the limits an edit is judged against. The
 * agent applies them on the server and the builder replays its edits under
 * the same object, so the two cannot disagree.
 */
export function operationLimitsFor(features: TierFeatures): OperationLimits {
	return {
		sections: features.sections_per_catalogue,
		items: features.items_per_catalogue,
		sectionTypes: {
			divider: features.sections.divider,
			embedding: features.sections.embedding,
			customVisual: features.sections.customVisual,
		},
		branding: features.branding,
		advancedAppearance: features.advancedAppearance,
		newsletter: features.newsletter,
	};
}

/** Whether one more item fits in the whole catalogue. */
export function canAddItem(
	content: unknown,
	items: number | "unlimited" | undefined,
): boolean {
	return typeof items !== "number" || countPlanItems(content) < items;
}
