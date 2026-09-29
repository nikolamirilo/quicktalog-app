"use client";
import type { PricingPlan, Usage } from "@quicktalog/common";

import { UpgradePlanCTA } from "@/components/general/UpgradePlanCTA";

type LimitCTAsProps = {
	currentPlan: PricingPlan;
	usage: Usage;
};

export function LimitCTAs({ currentPlan, usage }: LimitCTAsProps) {
	const isAtCatalogueLimit =
		usage.catalogues >= currentPlan.features.catalogues;
	const isAtTrafficLimit =
		usage.traffic.pageviews >= currentPlan.features.traffic_limit;

	return (
		<>
			{isAtCatalogueLimit && (
				<UpgradePlanCTA
					ctaLabel="Upgrade plan"
					href="/pricing"
					subtitle="Upgrade your plan to get more catalogues, features, and higher limits."
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
