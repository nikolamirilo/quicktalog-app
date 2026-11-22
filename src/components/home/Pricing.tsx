"use client";

import { useRef } from "react";

import { Rise } from "@/components/general/Rise";
import { BillingToggle } from "@/components/pricing/BillingToggle";
import { FeatureInfoDialog } from "@/components/pricing/FeatureInfoDialog";
import { MiniCTA } from "@/components/pricing/MiniCTA";
import { PricingColumn } from "@/components/pricing/PricingColumn";
import {
	POPULAR_TIER_ID,
	paidTiers,
	priceIdFor,
	starterTier,
} from "@/constants/pricing";
import { useNearViewport } from "@/hooks/useNearViewport";
import type { PaddlePrices } from "@/hooks/usePaddlePrices";
import { usePricingPlans } from "@/hooks/usePricingPlans";

/**
 * Home pricing: starter row, the four paid tiers and the custom-plan strip.
 * `initialPrices` are rendered by the server, so the home page carries real prices
 * in its HTML rather than a dash.
 *
 * Far below the hero, so Paddle.js waits until this comes into reach instead of
 * loading during the first paint.
 */
export function Pricing({
	initialPrices = {},
}: {
	initialPrices?: PaddlePrices;
}) {
	const sectionRef = useRef<HTMLDivElement>(null);
	const near = useNearViewport(sectionRef);
	const {
		prices,
		pricesUnavailable,
		billingCycle,
		setBillingCycle,
		startCheckout,
		pendingPriceId,
		featureInfo,
	} = usePricingPlans(initialPrices, near);

	const starterPriceId = priceIdFor(starterTier, billingCycle);

	return (
		<div ref={sectionRef}>
			<BillingToggle
				className="mb-7"
				cycle={billingCycle}
				onChange={setBillingCycle}
			/>
			<PricingColumn
				billingCycle={billingCycle}
				mode="row"
				onInfo={featureInfo.showInfo}
				onSelect={() => startCheckout(starterTier, starterPriceId)}
				pending={pendingPriceId === starterPriceId}
				price={prices[starterPriceId]}
				priceUnavailable={pricesUnavailable}
				tier={starterTier}
			/>
			<div className="grid grid-cols-1 gap-[18px] md:grid-cols-2 lg:grid-cols-4">
				{paidTiers.map((tier, index) => {
					const priceId = priceIdFor(tier, billingCycle);
					return (
						<Rise className="h-full" delay={index * 70} key={tier.id}>
							<PricingColumn
								billingCycle={billingCycle}
								highlight={tier.id === POPULAR_TIER_ID}
								onInfo={featureInfo.showInfo}
								onSelect={() => startCheckout(tier, priceId)}
								pending={pendingPriceId === priceId}
								price={prices[priceId]}
								priceUnavailable={pricesUnavailable}
								tier={tier}
							/>
						</Rise>
					);
				})}
			</div>
			<MiniCTA />
			<FeatureInfoDialog state={featureInfo} />
		</div>
	);
}
