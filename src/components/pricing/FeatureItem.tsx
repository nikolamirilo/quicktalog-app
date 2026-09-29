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
	const { type } = feature;
	return (
		<li className="flex items-start gap-2.5 text-[14.5px] leading-[1.5] text-product-foreground-accent">
			<PlanCheck />
			<span className="flex flex-1 items-start gap-1.5">
				<span>{feature.text}</span>
				{type && onInfo && (
					<button
						aria-label={`What does ${feature.text} mean?`}
						className="mt-px grid flex-none place-items-center rounded-full p-0.5 text-product-muted transition-colors hover:text-product-primary-ink"
						onClick={(event) => onInfo(type, event.currentTarget)}
						type="button"
					>
						<Info aria-hidden="true" className="h-3.5 w-3.5" />
					</button>
				)}
			</span>
		</li>
	);
}
