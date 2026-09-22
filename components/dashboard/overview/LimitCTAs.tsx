"use client";
import type { Usage } from "@quicktalog/common";
import UpgradePlanCTA from "../../general/UpgradePlanCTA";

export interface LimitCTAs {
	matchedTier: any;
	usage: Usage;
}

export default function LimitCTAs({ matchedTier, usage }: LimitCTAs) {
	const isAtCatalogueLimit =
		usage.catalogues >= matchedTier.features.catalogues;
	const isAtTrafficLimit =
		usage.traffic.pageview_count >= matchedTier.features.traffic_limit;

	return (
		<>
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
