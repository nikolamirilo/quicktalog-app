import { Info } from "lucide-react";

import { PlanCheck } from "@/components/pricing/PlanCheck";
import type { PlanFeature } from "@/constants/pricing";
import type { ShowFeatureInfo } from "@/hooks/useFeatureInfo";

/** One plan feature line, with an "i" button when the feature has an explainer. */
export function FeatureItem({
	feature,
	onInfo,
}: {
	feature: PlanFeature | { text: string; type?: undefined };
	onInfo?: ShowFeatureInfo;
}) {
	const { text, type } = feature;
	const infoButton =
		type && onInfo ? (
			<button
				aria-label={`What does ${text} mean?`}
				className="ml-1 inline-flex translate-y-[0.1em] items-center justify-center rounded-full align-middle text-product-muted transition-colors hover:text-product-primary-ink"
				onClick={(event) => onInfo(type, event.currentTarget)}
				type="button"
			>
				<Info aria-hidden="true" className="h-3.5 w-3.5" />
			</button>
		) : null;
	// The icon flows after the text, tied to the last word so it never wraps on its own.
	const split = infoButton ? text.lastIndexOf(" ") + 1 : text.length;
	return (
		<li className="flex items-start gap-2.5 text-[14.5px] leading-[1.5] text-product-foreground-accent">
			<PlanCheck />
			<span className="flex-1">
				{text.slice(0, split)}
				{infoButton && (
					<span className="whitespace-nowrap">
						{text.slice(split)}
						{infoButton}
					</span>
				)}
			</span>
		</li>
	);
}
