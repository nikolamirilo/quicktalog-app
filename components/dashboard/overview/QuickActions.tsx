"use client";
import type { Usage } from "@quicktalog/common";
import UpgradePlanCTA from "../../general/UpgradePlanCTA";
import CreateCatalogueButton from "../components/CreateCatalogueButton";

export interface QuickActionsProps {
	matchedTier: any;
	usage: Usage;
}

export default function QuickActions({
	matchedTier,
	usage,
}: QuickActionsProps) {
	const isAtCatalogueLimit =
		usage.catalogues >= matchedTier.features.catalogues;
	const isAtTrafficLimit =
		usage.traffic.pageview_count >= matchedTier.features.traffic_limit;

	return (
		<>
			<div className="flex flex-wrap gap-2 sm:gap-3 lg:gap-4 mb-4 sm:mb-6">
				<span className="w-9/12 sm:w-fit">
					<CreateCatalogueButton
						disabled={isAtCatalogueLimit || isAtTrafficLimit}
						showUpgradeTooltip={isAtCatalogueLimit || isAtTrafficLimit}
					/>
				</span>
			</div>
			{isAtCatalogueLimit && (
				<UpgradePlanCTA
					ctaLabel="Upgrade plan"
					href="/pricing"
					subtitle=" Upgrade your plan to get more catalogues, features, and higher limits."
					title="You've reached your current catalogue limit"
				/>
			)}
			{isAtTrafficLimit && (
				<UpgradePlanCTA
					ctaLabel="Upgrade plan"
					href="/pricing"
					subtitle="Upgrade your plan to increase your traffic limit and reactivate your catalogues."
					title="You've reached your traffic limit"
				/>
			)}
		</>
	);
}
