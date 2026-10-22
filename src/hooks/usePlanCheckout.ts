"use client";

import type { Paddle } from "@paddle/paddle-js";
import type { PricingPlan, UserData } from "@quicktalog/common";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { isFreeTier, standardTiers } from "@/constants/pricing";
import { createCheckout } from "@/lib/paddle/checkout";

const SIGNUP_URL = "/auth?mode=signup";
const SUBSCRIPTION_URL = "/admin/dashboard?tab=subscription";

/**
 * Starts a Paddle checkout for a paid plan; `pendingPriceId` marks the busy
 * button. The free plan never opens a checkout: visitors go to sign-up and
 * signed-in users to their subscription tab.
 */
export function usePlanCheckout(
	paddle: Paddle | undefined,
	user: UserData | null,
) {
	const router = useRouter();
	const [pendingPriceId, setPendingPriceId] = useState<string | null>(null);

	const startCheckout = async (tier: PricingPlan, priceId: string) => {
		if (isFreeTier(tier)) {
			router.push(user ? SUBSCRIPTION_URL : SIGNUP_URL);
			return;
		}

		if (!user) {
			router.push("/auth");
			return;
		}

		const matchedTier = standardTiers.find((t: PricingPlan) =>
			user.planId ? Object.values(t.priceId).includes(user.planId) : false,
		);

		if (matchedTier && matchedTier.name === tier.name) {
			alert("You currently have this plan");
			return;
		}

		if (!paddle?.Checkout) {
			alert("Checkout is still loading. Please try again in a moment.");
			return;
		}

		setPendingPriceId(priceId);
		try {
			// The server creates the transaction: it pins the Paddle customer to
			// the signed-in account and signs the user id the webhook will read,
			// so the plan cannot be bought for somebody else.
			const result = await createCheckout(priceId);
			if ("error" in result) {
				alert(result.error);
				return;
			}
			paddle.Checkout.open({
				transactionId: result.transactionId,
				settings: {
					successUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/admin/checkout/success`,
				},
			});
		} catch {
			alert("We couldn't start the checkout. Please try again in a moment.");
		} finally {
			setPendingPriceId(null);
		}
	};

	return { startCheckout, pendingPriceId };
}
