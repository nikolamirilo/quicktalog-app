"use client";
import type { Paddle } from "@paddle/paddle-js";
import clsx from "clsx";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { BsFillCheckCircleFill } from "react-icons/bs";
import { FiInfo } from "react-icons/fi";
import InformModal from "@/components/modals/InformModal";
import { Button } from "@/components/ui/button";
import { tiers } from "@/constants/pricing";
import { formatPrice } from "@/helpers/client";
import type { PricingPlan, User } from "@/types";

interface PricingColumnProps {
	tier: PricingPlan;
	highlight?: boolean;
	price: string;
	billingCycle: "monthly" | "yearly";
	paddle: Paddle;
	priceId: string;
	user: User;
	mode?: "column" | "row";
}

const PricingColumn: React.FC<PricingColumnProps> = ({
	tier,
	highlight = false,
	price,
	billingCycle,
	paddle,
	priceId,
	user,
	mode = "column",
}) => {
	const [isHovered, setIsHovered] = useState(false);
	const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
	const [currentFeature, setCurrentFeature] = useState("");
	const router = useRouter();

	const getFeatureList = (features: PricingPlan["features"]) => {
		return [
			{
				text: `${features.catalogues} ${features.catalogues > 1 ? "catalogues" : "catalogue"}`,
				type: "catalogues",
			},
			{
				text:
					features.categories_per_catalogue === "unlimited"
						? "Unlimited categories & items"
						: `Up to ${features.categories_per_catalogue} categories & ${features.items_per_catalogue} items per catalogue`,
				type: "categories_and_items",
			},
			// { text: `${features.analytics} analytics`, type: "analytics" },
			{
				text: `${features.traffic_limit.toLocaleString()} page views per month`,
				type: "traffic-limit",
			},
			features.ai_prompts === 0
				? null
				: {
						text: `${features.ai_prompts} AI prompts per month`,
						type: "ai-catalogue-generation",
					},
			features.ocr_ai_import === 0
				? null
				: {
						text: `${features.ocr_ai_import} OCR AI imports per month`,
						type: "ocr-ai-import",
					},

			features.newsletter ? { text: "Newsletter", type: "newsletter" } : null,
			features.custom_features
				? { text: "Custom features", type: "custom-features" }
				: null,
			{ text: features.support, type: "support" },
		].filter(Boolean);
	};

	const displayPrice = price ? formatPrice(price) : "N/A";
	const cycleLabel = billingCycle === "yearly" ? "/year" : "/month";

	const getFeatureExplanation = (feature: string): string => {
		const explanations: { [key: string]: string } = {
			support:
				"Technical assistance when you need help. Email support provides responses within 24-48 hours. Priority Support includes email, live chat, and scheduled calls for immediate assistance.",
			catalogues:
				"Number of digital catalogs you can create. Each catalog displays your services with pricing, descriptions, images, and contact information on a shareable public page.",
			analytics:
				"Track visitor engagement on your catalogs. Basic analytics show page views and visitor counts. Advanced analytics provide detailed insights on popular services and visitor behavior patterns.",
			"traffic-limit":
				"Monthly page view allowance across all your catalogs. This counts every time someone visits your catalog pages. Higher limits accommodate more customer traffic.",
			custom_features:
				"Branding control for your catalogs. Basic includes themes and colors. Moderate adds logo upload. Advanced provides full branding with legal information, contact details, and action buttons.",
			"ocr-ai-import":
				"AI-powered feature that extracts text from uploaded images or documents to automatically create catalog items. Streamlines the process of digitizing existing price lists or menus.",
			"ai-catalogue-generation":
				"AI assistance that helps create & edit your digital catalogues. Describe your services and the AI generates professional descriptions and organizes items into categories for your catalog.",
			newsletter:
				"Email collection system integrated into your catalogs. Visitors can subscribe to receive updates, and you can send newsletters to your subscriber list.",
			"custom-features":
				"Direct access to our development team to request custom features and integrations tailored to your specific business needs. Contact us to discuss specialized functionality beyond standard catalog features.",
			categories_and_items:
				"The total number of categories and items allowed in each catalogue. Higher tiers unlock unlimited organization for complex menus or product lists.",
		};
		return explanations[feature] || "Information about this feature.";
	};

	const handleInfoClick = (feature: string) => {
		setCurrentFeature(feature);
		setIsInfoModalOpen(true);
	};

	const filteredTiers = tiers.filter((item) => item?.type === "standard");

	const handleButtonClick = () => {
		if (user) {
			const matchedTier = filteredTiers.find((tier) =>
				Object.values(tier.priceId).includes(user.plan_id),
			);
			if (tier.name === matchedTier.name) {
				alert("You currently have this plan");
			} else {
				paddle.Checkout.open({
					items: [{ priceId: priceId, quantity: 1 }],
					customer: user?.email ? { email: user.email } : undefined,
					settings: {
						successUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/admin/checkout/success`,
					},
				});
			}
		} else {
			router.push("/auth");
		}
	};

	const getButtonText = () => {
		if (!user) return "Get Started";

		const currentTier = filteredTiers.find((t) =>
			Object.values(t.priceId).includes(user.plan_id),
		);

		if (!currentTier) return "Get Started";
		if (currentTier.name === tier.name) return "Current Plan";
		return currentTier.id > tier.id ? "Downgrade" : "Upgrade";
	};

	// Row mode layout
	if (mode === "row") {
		return (
			<div
				className={clsx(
					"group relative w-full bg-product-background text-product-foreground rounded-xl border border-product-border transition-all duration-300 ease-out",
					{
						"shadow-[var(--product-shadow)] hover:shadow-[var(--product-hover-shadow)]":
							!highlight,
						"shadow-[var(--product-hover-shadow)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.15)]":
							highlight,
						"hover:scale-[1.01]": true,
					},
				)}
				onMouseEnter={() => setIsHovered(true)}
				onMouseLeave={() => setIsHovered(false)}
				style={{
					boxShadow: highlight
						? "var(--product-hover-shadow)"
						: "var(--product-shadow)",
				}}
			>
				<div className="p-6 flex flex-col md:flex-row md:items-center gap-4">
					{/* Plan Info Section */}
					<div className="flex-shrink-0 md:w-64 relative">
						{highlight && (
							<div className="absolute -top-8 left-0">
								<div className="bg-product-primary text-product-background px-3 py-1 rounded-full text-xs font-semibold shadow-md">
									Most Popular
								</div>
							</div>
						)}
						<h3
							className={clsx(
								"text-lg font-bold mb-2 text-product-primary transition-colors duration-300 font-lora",
								{ "text-product-primary-accent": highlight && isHovered },
							)}
						>
							{tier.name}
						</h3>
						<p className="text-product-foreground-accent text-sm leading-relaxed font-lora mb-3">
							{tier.description}
						</p>
						<div>
							<span
								className={clsx(
									"text-3xl font-bold text-product-foreground transition-all duration-300 font-lora",
									{ "scale-105": isHovered },
								)}
							>
								{displayPrice}
							</span>
							<span className="text-sm font-normal text-product-foreground-accent ml-2 font-lora">
								{cycleLabel}
							</span>
						</div>
					</div>

					{/* Features Section */}
					<div className="flex-grow">
						<div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
							{getFeatureList(tier.features).map((feature) => (
								<div
									className="flex items-start transition-all duration-300"
									key={tier.id}
								>
									<div className="flex-shrink-0 w-4 h-4 bg-product-primary/10 rounded-full flex items-center justify-center mr-2 mt-0.5">
										<BsFillCheckCircleFill className="w-2.5 h-2.5 text-product-primary" />
									</div>
									<div className="flex items-center gap-1.5 flex-grow">
										<span className="text-sm text-product-foreground-accent leading-relaxed font-lora">
											{feature.text}
										</span>
										<button
											className="hover:text-product-primary transition-colors duration-200 z-10 flex-shrink-0"
											onClick={() => handleInfoClick(feature.type)}
											type="button"
										>
											<FiInfo size={12} />
										</button>
									</div>
								</div>
							))}
						</div>
					</div>

					{/* CTA Section */}
					<div className="flex-shrink-0 md:w-40">
						<Button
							className="w-full py-2.5 rounded-lg font-semibold transition-all duration-200 hover:scale-[1.02] text-sm"
							onClick={handleButtonClick}
							variant={
								highlight || getButtonText() === "Upgrade"
									? "cta"
									: "cta-secondary"
							}
						>
							{getButtonText()}
						</Button>
					</div>
				</div>

				<InformModal
					cancelText=""
					confirmText="Got it!"
					isOpen={isInfoModalOpen}
					message={getFeatureExplanation(currentFeature)}
					onCancel={() => setIsInfoModalOpen(false)}
					onConfirm={() => setIsInfoModalOpen(false)}
					title={`${currentFeature
						.replace(/-/g, " ")
						.replace(/\b\w/g, (l) => l.toUpperCase())
						.split("_")
						.join(" ")} Explained`}
				/>
			</div>
		);
	}

	// Column mode layout (original)
	return (
		<div
			className={clsx(
				"group relative w-full max-w-sm mx-auto bg-product-background text-product-foreground rounded-2xl border border-product-border lg:max-w-full transition-all duration-300 ease-out h-full flex flex-col",
				{
					"shadow-[var(--product-shadow)] hover:shadow-[var(--product-hover-shadow)]":
						!highlight,
					"shadow-[var(--product-hover-shadow)] hover:shadow-[0_16px_50px_rgba(0,0,0,0.18)]":
						highlight,
					"hover:scale-[1.02] hover:-translate-y-1": true,
				},
			)}
			onMouseEnter={() => setIsHovered(true)}
			onMouseLeave={() => setIsHovered(false)}
			style={{
				boxShadow: highlight
					? "var(--product-hover-shadow)"
					: "var(--product-shadow)",
			}}
		>
			{/* Header Section */}
			<div className="p-6 flex-shrink-0">
				<h3
					className={clsx(
						"text-xl font-bold mb-3 text-product-primary transition-colors duration-300 font-lora",
						{ "text-product-primary-accent": highlight && isHovered },
					)}
				>
					{tier.name}
				</h3>
				<p className="text-product-foreground-accent mb-4 text-sm leading-relaxed font-lora">
					{tier.description}
				</p>

				<div className="mb-6">
					<span
						className={clsx(
							"text-4xl font-bold text-product-foreground transition-all duration-300 font-lora",
							{ "scale-105": isHovered },
						)}
					>
						{displayPrice}
					</span>
					<span className="text-sm font-normal text-product-foreground-accent ml-2 font-lora">
						{cycleLabel}
					</span>
				</div>

				<Button
					className="w-full py-3 rounded-lg font-semibold transition-all duration-200 hover:scale-[1.02]"
					onClick={handleButtonClick}
					variant={
						highlight || getButtonText() === "Upgrade" ? "cta" : "cta-secondary"
					}
				>
					{getButtonText()}
				</Button>
			</div>

			{/* Features Section */}
			<div className="px-8 pb-8 flex-grow">
				<p className="font-bold mb-2 text-sm uppercase tracking-wider text-product-foreground transition-colors duration-300 group-hover:text-product-primary font-lora">
					FEATURES
				</p>

				<ul className="space-y-3">
					{getFeatureList(tier.features).map((feature) => (
						<li
							className="flex items-start transition-all duration-300"
							key={tier.id}
						>
							<div className="flex-shrink-0 w-5 h-5 bg-product-primary/10 rounded-full flex items-center justify-center mr-3 mt-0.5">
								<BsFillCheckCircleFill className="w-3 h-3 text-product-primary" />
							</div>
							<div className="flex items-center gap-2 flex-grow">
								<span className="text-sm text-product-foreground-accent leading-relaxed font-lora">
									{feature.text}
								</span>
								<button
									className="hover:text-product-primary transition-colors duration-200 z-10 flex-shrink-0"
									onClick={() => handleInfoClick(feature.type)}
									type="button"
								>
									<FiInfo size={14} />
								</button>
							</div>
						</li>
					))}
				</ul>
			</div>

			{/* Popular badge */}
			{highlight && (
				<div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
					<div className="bg-product-primary text-product-background px-4 py-1 shadown-md rounded-full text-xs font-semibold shadow-lg transition-all duration-300 group-hover:scale-105">
						Most Popular
					</div>
				</div>
			)}

			<InformModal
				cancelText=""
				confirmText="Got it!"
				isOpen={isInfoModalOpen}
				message={getFeatureExplanation(currentFeature)}
				onCancel={() => setIsInfoModalOpen(false)}
				onConfirm={() => setIsInfoModalOpen(false)}
				title={`${currentFeature
					.replace(/-/g, " ")
					.replace(/\b\w/g, (l) => l.toUpperCase())
					.split("_")
					.join(" ")} Explained`}
			/>
		</div>
	);
};

export default PricingColumn;
