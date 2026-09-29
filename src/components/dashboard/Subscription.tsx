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

			<PlanFeatures features={currentPlan.features} />
		</div>
	);
}
