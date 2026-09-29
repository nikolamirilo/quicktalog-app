"use client";
import type { PricingPlan } from "@quicktalog/common";
import { CalendarDays } from "lucide-react";

import { AppTitle } from "@/components/dashboard/common/AppHeadings";
import { PlanDetails } from "@/components/dashboard/subscription/PlanDetails";
import { PlanFeatures } from "@/components/dashboard/subscription/PlanFeatures";
import { usePaddle } from "@/hooks/usePaddle";
import { usePaddlePrices } from "@/hooks/usePaddlePrices";

const CUSTOMER_PORTAL_URL =
	"https://customer-portal.paddle.com/cpl_01k11h2axbrhg4fzmw2zey50x0";

type SubscriptionProps = {
	currentPlan: PricingPlan;
};

/** Flattens the nested feature groups into one list of plan features. */
function expandFeatures(
	features: PricingPlan["features"],
): Record<string, unknown> {
	const result: Record<string, unknown> = {};
	for (const [key, value] of Object.entries(features)) {
		if (key === "sections" && typeof value === "object" && value !== null) {
			const sections = value as Record<string, unknown>;
			result.divider = sections.divider;
			result.embedding = sections.embedding;
			result.customCode = sections.customCode;
		} else if (
			key === "apperance" &&
			typeof value === "object" &&
			value !== null
		) {
			const appearance = value as Record<string, unknown>;
			result.styles = appearance.styles;
			result.standardThemes = appearance.standardThemes;
			result.customThemes = appearance.customThemes;
		} else {
			result[key] = value;
		}
	}
	return result;
}

export function Subscription({ currentPlan }: SubscriptionProps) {
	const paddle = usePaddle();
	const { prices, loading, unavailable } = usePaddlePrices(paddle, "US");

	const priceId = currentPlan.billing_period
		? currentPlan.priceId?.[currentPlan.billing_period]
		: undefined;
	const currentPrice = priceId ? prices[priceId] : "0";

	return (
		<div>
			<AppTitle icon={<CalendarDays />}>Subscription Overview</AppTitle>

			<PlanDetails
				currentPlan={currentPlan}
				currentPrice={currentPrice}
				loading={loading && !unavailable}
				manageSubscriptionUrl={CUSTOMER_PORTAL_URL}
			/>

			<PlanFeatures features={expandFeatures(currentPlan.features)} />
		</div>
	);
}
