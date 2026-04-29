"use client";
import { formatPrice } from "@/helpers/client";
import { usePaddlePrices } from "@/hooks/usePaddlePrices";
import { Environments, initializePaddle, Paddle } from "@paddle/paddle-js";
import { PricingPlan } from "@quicktalog/common";
import { X } from "lucide-react";
import { useEffect, useState } from "react";
import PlanComparison from "./upgrade/PlanComparison";
import PlanSelector from "./upgrade/PlanSelector";

interface UpgradePlanModalProps {
	isOpen: boolean;
	onClose: () => void;
	currentPlan: PricingPlan;
	requiredPlan: PricingPlan;
	limitType: "items" | "sections";
	userEmail?: string;
}

const UpgradePlanModal: React.FC<UpgradePlanModalProps> = ({
	isOpen,
	onClose,
	currentPlan,
	requiredPlan,
	limitType,
	userEmail,
}) => {
	const [paddle, setPaddle] = useState<Paddle | undefined>(undefined);
	const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">(
		"monthly",
	);
	const { prices } = usePaddlePrices(paddle, "US");

	useEffect(() => {
		if (
			process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN &&
			process.env.NEXT_PUBLIC_PADDLE_ENV
		) {
			initializePaddle({
				token: process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN,
				environment: process.env.NEXT_PUBLIC_PADDLE_ENV as Environments,
			}).then((paddleInstance) => {
				if (paddleInstance) setPaddle(paddleInstance);
			});
		}
	}, []);

	if (!isOpen) return null;

	const currentPrice =
		prices[
			billingCycle === "monthly"
				? currentPlan.priceId.month
				: currentPlan.priceId.year
		];
	const requiredPrice =
		prices[
			billingCycle === "monthly"
				? requiredPlan.priceId.month
				: requiredPlan.priceId.year
		];

	const displayCurrentPrice = currentPrice ? formatPrice(currentPrice) : "N/A";
	const displayRequiredPrice = requiredPrice
		? formatPrice(requiredPrice)
		: "N/A";

	const cycleLabel = billingCycle === "yearly" ? "/year" : "/month";

	const handleUpgrade = () => {
		if (paddle) {
			const priceId =
				billingCycle === "monthly"
					? requiredPlan.priceId.month
					: requiredPlan.priceId.year;
			paddle.Checkout.open({
				items: [{ priceId: priceId, quantity: 1 }],
				customer: userEmail ? { email: userEmail } : undefined,
				settings: {
					successUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/admin/checkout/success`,
				},
			});
		}
	};

	return (
		<div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4">
			<div className="bg-product-background rounded-xl sm:rounded-2xl shadow-2xl max-w-4xl w-full mx-auto overflow-hidden max-h-[95dvh] sm:max-h-[90dvh] overflow-y-auto">
				{/* Header */}
				<div className="relative p-4 sm:p-6 bg-gradient-to-br from-product-background-hero to-product-background border-b border-product-border">
					<button
						className="absolute top-3 right-3 sm:top-4 sm:right-4 text-product-foreground-accent hover:text-product-foreground transition-colors"
						onClick={onClose}
					>
						<X className="w-5 h-5" />
					</button>

					<h2 className="text-xl sm:text-2xl font-bold mb-2 text-product-foreground font-lora text-left pr-8">
						Need more {limitType}?
					</h2>
					<p className="text-xs sm:text-sm text-product-foreground-accent font-lora text-left">
						The {currentPlan.name} plan only comes with{" "}
						{limitType === "items"
							? currentPlan.features.items_per_catalogue
							: currentPlan.features.sections_per_catalogue}{" "}
						{limitType} per catalogue.
					</p>
				</div>

				{/* Content */}
				<div className="p-4 sm:p-6">
					<PlanSelector
						billingCycle={billingCycle}
						onBillingCycleChange={setBillingCycle}
					/>

					<PlanComparison
						canUpgrade={!!paddle}
						currentPlan={currentPlan}
						cycleLabel={cycleLabel}
						displayCurrentPrice={displayCurrentPrice}
						displayRequiredPrice={displayRequiredPrice}
						limitType={limitType}
						onUpgrade={handleUpgrade}
						requiredPlan={requiredPlan}
					/>
				</div>
			</div>
		</div>
	);
};

export default UpgradePlanModal;
