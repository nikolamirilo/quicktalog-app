"use client";

import { useState } from "react";

import type { BillingCycle } from "@/constants/pricing";
import { useUserContext } from "@/context/UserContext";
import { useFeatureInfo } from "@/hooks/useFeatureInfo";
import { usePaddle } from "@/hooks/usePaddle";
import { usePaddlePrices } from "@/hooks/usePaddlePrices";
import { usePlanCheckout } from "@/hooks/usePlanCheckout";

/**
 * Everything a pricing view needs: Paddle prices (USD), the billing cycle,
 * checkout for the signed-in user and the feature explainer dialog state.
 */
export function usePricingPlans() {
	const paddle = usePaddle();
	const { prices, unavailable } = usePaddlePrices(paddle, "US");
	const { userData } = useUserContext();
	const [billingCycle, setBillingCycle] = useState<BillingCycle>("monthly");
	const { startCheckout, pendingPriceId } = usePlanCheckout(paddle, userData);
	const featureInfo = useFeatureInfo();

	return {
		prices,
		pricesUnavailable: unavailable,
		billingCycle,
		setBillingCycle,
		startCheckout,
		pendingPriceId,
		featureInfo,
	};
}
