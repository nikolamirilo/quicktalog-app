import { usePaddlePrices } from "@/hooks/usePaddlePrices";
import type { SubscriptionProps } from "@/types/shared";
import { Environments, initializePaddle, Paddle } from "@paddle/paddle-js";
import { useEffect, useState } from "react";
import { FiCalendar } from "react-icons/fi";
import BillingHistory from "./subscription/BillingHistory";
import PlanDetails from "./subscription/PlanDetails";
import { useRouter } from "next/navigation";

export default function Subscription({
	pricingPlan,
	subscriptionStartDate,
	subscriptionUpdatedDate,
}: SubscriptionProps) {
	const [paddle, setPaddle] = useState<Paddle | undefined>(undefined);
	const { prices, loading } = usePaddlePrices(paddle, "US");
	const router = useRouter();

	useEffect(() => {
		if (
			process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN &&
			process.env.NEXT_PUBLIC_PADDLE_ENV
		) {
			initializePaddle({
				token: process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN,
				environment: process.env.NEXT_PUBLIC_PADDLE_ENV as Environments,
			}).then((paddle) => {
				if (paddle) {
					setPaddle(paddle);
				}
			});
		}
	}, []);

	const expandFeatures = (
		features: Record<string, any>,
	): Record<string, any> => {
		const result: Record<string, any> = {};
		for (const [key, value] of Object.entries(features)) {
			if (key === "blocks" && typeof value === "object" && value !== null) {
				result["divider"] = value.divider;
				result["embedding"] = value.embedding;
				result["customCode"] = value.customCode;
			} else if (
				key === "apperance" &&
				typeof value === "object" &&
				value !== null
			) {
				result["styles"] = value.styles;
				result["standardThemes"] = value.standardThemes;
			} else {
				result[key] = value;
			}
		}
		return result;
	};

	// Get current price from Paddle
	const currentPrice = pricingPlan.priceId
		? prices[pricingPlan.priceId[pricingPlan.billing_period]]
		: "0";
	console.log(currentPrice);

	const expandedFeatures = pricingPlan
		? expandFeatures(pricingPlan.features)
		: {};

	return (
		<div className="max-w-5xl space-y-6">
			<h2 className="text-base sm:text-lg md:text-xl lg:text-2xl xl:text-3xl font-bold mb-4 sm:mb-6 text-product-foreground flex items-center gap-2 sm:gap-3 font-heading">
				<FiCalendar className="text-product-icon font-lora w-6 h-6 sm:w-8 sm:h-8" />{" "}
				Subscription Overview
			</h2>

			<PlanDetails
				currentPrice={currentPrice}
				loading={loading}
				onManageSubscription={() =>
					router.push(
						"https://customer-portal.paddle.com/cpl_01k11h2axbrhg4fzmw2zey50x0",
					)
				}
				onUpgrade={() => router.push("/pricing")}
				pricingPlan={pricingPlan}
				subscriptionStartDate={subscriptionStartDate}
				subscriptionUpdatedDate={subscriptionUpdatedDate}
			/>

			{pricingPlan && <BillingHistory expandedFeatures={expandedFeatures} />}
		</div>
	);
}
