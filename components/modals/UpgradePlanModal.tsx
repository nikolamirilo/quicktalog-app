"use client";
import { Environments, initializePaddle, Paddle } from "@paddle/paddle-js";
import { PricingPlan } from "@quicktalog/common";
import { X } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { BsFillCheckCircleFill } from "react-icons/bs";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/helpers/client";
import { usePaddlePrices } from "@/hooks/usePaddelPrices";

interface UpgradePlanModalProps {
	isOpen: boolean;
	onClose: () => void;
	currentPlan: PricingPlan;
	requiredPlan: PricingPlan;
	limitType: "items" | "categories";
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

	const getRelevantFeatures = (plan: PricingPlan) => {
		const features = [];

		if (limitType === "categories" || limitType === "items") {
			features.push({
				text:
					plan.name === "Premium"
						? "Unlimited categories & items"
						: `Up to ${plan.features.categories_per_catalogue} categories & ${plan.features.items_per_catalogue} items`,
				type: "items",
			});
		}

		features.push(
			{
				text: `${plan.features.catalogues} ${plan.features.catalogues > 1 ? "catalogues" : "catalogue"}`,
				type: "catalogues",
			},
			{ text: `${plan.features.analytics} analytics`, type: "analytics" },
			{
				text: `${plan.features.traffic_limit.toLocaleString()} traffic limit`,
				type: "traffic-limit",
			},
		);

		if (plan.features.ai_prompts > 0) {
			features.push({
				text: `${plan.features.ai_prompts} AI generations`,
				type: "ai",
			});
		}

		if (plan.features.ocr_ai_import > 0) {
			features.push({
				text: `${plan.features.ocr_ai_import} OCR imports`,
				type: "ocr",
			});
		}

		return features;
	};

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
			<div className="bg-product-background rounded-xl sm:rounded-2xl shadow-2xl max-w-4xl w-full mx-auto overflow-hidden max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
				{/* Header */}
				<div className="relative p-4 sm:p-6 bg-gradient-to-br from-hero-product-background to-product-background border-b border-product-border">
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
							: currentPlan.features.categories_per_catalogue}{" "}
						{limitType} per catalogue.
					</p>
				</div>

				{/* Content */}
				<div className="p-4 sm:p-6">
					{/* Billing Cycle Toggle */}
					<div className="flex items-center justify-center mb-4 sm:mb-6">
						<div className="relative inline-flex w-full max-w-[260px] bg-product-background border border-product-border rounded-full p-1 shadow-sm">
							<span
								aria-hidden="true"
								className={`absolute top-1 bottom-1 left-1 w-[calc(50%-4px)] rounded-full bg-product-primary transition-transform duration-300 ease-out ${
									billingCycle === "yearly"
										? "translate-x-full"
										: "translate-x-0"
								}`}
							/>
							<button
								className={`relative z-10 flex-1 px-4 py-1.5 text-sm rounded-full transition-colors font-lora ${
									billingCycle === "monthly"
										? "text-product-foreground font-bold"
										: "text-product-foreground/60 font-medium"
								}`}
								onClick={() => setBillingCycle("monthly")}
								type="button"
							>
								Monthly
							</button>
							<button
								className={`relative z-10 flex-1 px-4 py-1.5 text-sm rounded-full transition-colors font-lora ${
									billingCycle === "yearly"
										? "text-product-foreground font-bold"
										: "text-product-foreground/60 font-medium"
								}`}
								onClick={() => setBillingCycle("yearly")}
								type="button"
							>
								Yearly
							</button>
						</div>
					</div>

					{/* Plans Comparison */}
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
						{/* Current Plan */}
						<div className="rounded-xl border-2 border-product-border bg-product-background p-4 sm:p-6">
							<div className="mb-3 sm:mb-4">
								<div className="flex items-center gap-2 mb-2 flex-wrap">
									<h3 className="text-xl sm:text-2xl md:text-3xl font-bold text-product-primary font-lora">
										{currentPlan.name}
									</h3>
									<span className="px-2.5 py-1 bg-product-background border border-product-border text-product-foreground-accent text-xs font-medium rounded-md whitespace-nowrap">
										Current plan
									</span>
								</div>
								<p className="text-xs sm:text-sm text-product-foreground-accent font-lora leading-relaxed">
									{currentPlan.description}
								</p>
							</div>

							<div className="mb-4 sm:mb-6">
								<span className="text-2xl sm:text-3xl md:text-4xl font-bold text-product-foreground font-lora">
									{displayCurrentPrice}
								</span>
								<span className="text-xs sm:text-sm text-product-foreground-accent ml-2 font-lora">
									{cycleLabel}
								</span>
							</div>

							<div className="space-y-2 sm:space-y-3">
								{getRelevantFeatures(currentPlan).map((feature, index) => (
									<div
										className="flex items-start"
										key={`plan-feature-${index}`}
									>
										<div className="flex-shrink-0 w-4 h-4 sm:w-5 sm:h-5 bg-product-border/30 rounded-full flex items-center justify-center mr-2 sm:mr-3 mt-0.5">
											<BsFillCheckCircleFill className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-product-foreground-accent" />
										</div>
										<span className="text-xs sm:text-sm text-product-foreground-accent leading-relaxed font-lora">
											{feature.text}
										</span>
									</div>
								))}
							</div>
						</div>

						{/* Required Plan */}
						<div className="rounded-xl border-2 border-product-primary bg-gradient-to-br from-product-primary/5 to-transparent p-4 sm:p-6 relative">
							<div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
								<div className="bg-product-primary text-product-secondary px-3 sm:px-4 py-1 rounded-full text-xs font-semibold shadow-lg font-lora">
									Recommended
								</div>
							</div>

							<div className="mb-3 sm:mb-4">
								<h3 className="text-xl sm:text-2xl md:text-3xl font-bold text-product-primary font-lora mb-2">
									{requiredPlan.name}
								</h3>
								<p className="text-xs sm:text-sm text-product-foreground-accent font-lora leading-relaxed">
									{requiredPlan.description}
								</p>
							</div>

							<div className="mb-4 sm:mb-6">
								<span className="text-2xl sm:text-3xl md:text-4xl font-bold text-product-foreground font-lora">
									{displayRequiredPrice}
								</span>
								<span className="text-xs sm:text-sm text-product-foreground-accent ml-2 font-lora">
									{cycleLabel}
								</span>
							</div>

							<div className="space-y-2 sm:space-y-3 mb-3 sm:mb-4">
								{getRelevantFeatures(requiredPlan).map((feature, index) => (
									<div
										className="flex items-start"
										key={`plan-feature-${index}`}
									>
										<div className="flex-shrink-0 w-4 h-4 sm:w-5 sm:h-5 bg-product-primary/20 rounded-full flex items-center justify-center mr-2 sm:mr-3 mt-0.5">
											<BsFillCheckCircleFill className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-product-primary" />
										</div>
										<span className="text-xs sm:text-sm text-product-foreground leading-relaxed font-lora font-medium">
											{feature.text}
										</span>
									</div>
								))}
							</div>

							{/* See all features link inside card */}
							<Link
								className="text-xs sm:text-sm text-product-primary hover:underline font-lora flex items-center gap-1 mb-3 sm:mb-4"
								href="/pricing"
							>
								See all features →
							</Link>

							{/* Upgrade button inside card */}
							<Button
								className="w-full text-sm sm:text-base py-2 sm:py-3 font-lora"
								disabled={!paddle}
								onClick={handleUpgrade}
								variant="cta"
							>
								Upgrade to {requiredPlan.name}
							</Button>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};

export default UpgradePlanModal;
