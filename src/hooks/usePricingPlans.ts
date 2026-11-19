"use client";

import { useState } from "react";

import type { BillingCycle } from "@/constants/pricing";
import type { PaddlePrices } from "@/hooks/usePaddlePrices";
import { useUserContext } from "@/context/UserContext";
import { useFeatureInfo } from "@/hooks/useFeatureInfo";
import { usePaddle } from "@/hooks/usePaddle";
import { usePaddlePrices } from "@/hooks/usePaddlePrices";
import { usePlanCheckout } from "@/hooks/usePlanCheckout";

/**
 * Everything a pricing view needs: Paddle prices (USD), the billing cycle,
 * checkout for the signed-in user and the feature explainer dialog state.
 *
 * `initialPrices` are the ones the server rendered into the HTML, so the page never
 * starts on "Price loading".
 *
 * `enabled` holds Paddle.js back until the view is worth loading it for; the
 * server-rendered prices show either way.
 */
export function usePricingPlans(
	initialPrices: PaddlePrices = {},
	enabled = true,
) {
	const paddle = usePaddle(enabled);
	const { prices, unavailable } = usePaddlePrices(
		paddle,
		"US",
		initialPrices,
		enabled,
	);
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
