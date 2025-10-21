import {
	ArrowRight,
	FolderTree,
	Layers,
	Lock,
	Sparkles,
	TrendingUp,
	Zap,
} from "lucide-react";
import Link from "next/link";
import { IoSearch } from "react-icons/io5";
import {
	AlertDialog,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { tiers } from "@/constants/pricing";
import { PricingPlan } from "@/types";
import { LimitType } from "@/types/enums";
import { Button } from "../ui/button";

interface LimitsModalProps {
	isOpen: boolean;
	type: LimitType;
	currentPlan?: PricingPlan;
	requiredPlan?: PricingPlan;
	onClose?: () => void;
}

const formatLimit = (limit: number | "unlimited" | undefined) => {
	if (limit === "unlimited") return "Unlimited";
	if (limit === undefined) return "N/A";
	return limit.toLocaleString();
};

const getLimitContent = (
	type: LimitType,
	currentPlan?: PricingPlan,
	requiredPlan?: PricingPlan,
) => {
	const getCurrentLimit = () => {
		switch (type) {
			case "ai":
				return currentPlan.features.ai_prompts;
			case "catalogue":
				return currentPlan.features.catalogues;
			case "ocr":
				return currentPlan.features.ocr_ai_import;
			case "items":
				return currentPlan.features.items_per_catalogue;
			case "categories":
				return currentPlan.features.categories_per_catalogue;
			default:
				return undefined;
		}
	};

	const getNextLimit = () => {
		switch (type) {
			case "ai":
				return requiredPlan.features?.ai_prompts;
			case "catalogue":
				return requiredPlan.features?.catalogues;
			case "ocr":
				return requiredPlan.features?.ocr_ai_import;
			case "items":
				return requiredPlan.features?.items_per_catalogue;
			case "categories":
				return requiredPlan.features?.categories_per_catalogue;
			default:
				return undefined;
		}
	};

	const currentLimit = getCurrentLimit();
	const nextLimit = getNextLimit();

	switch (type) {
		case "ai":
			return {
				feature: "AI Catalogue Generation",
				icon: Sparkles,
				description: `Ready to create more catalogues instantly? Upgrade to unlock ${nextLimit === "unlimited" ? "unlimited" : nextLimit} AI-powered catalogue generations and scale your business faster.`,
				upgradeText: "AI generations",
				currentLimit,
				nextLimit,
				benefit:
					"Generate catalogues in seconds with AI - no manual work needed",
				valueProposition: "Save hours of manual work every week",
			};
		case "catalogue":
			return {
				feature: "Catalogues",
				icon: Layers,
				description: `Your business is growing! Get ${nextLimit === "unlimited" ? "unlimited" : nextLimit} catalogues to manage all your product lines in one place and serve more customers.`,
				upgradeText: "catalogues",
				currentLimit,
				nextLimit,
				benefit: "Manage unlimited product lines and grow without restrictions",
				valueProposition: "Expand your digital presence effortlessly",
			};
		case "ocr":
			return {
				feature: "OCR AI Import",
				icon: Zap,
				description: `Transform your printed materials into digital catalogues instantly. Upgrade to get ${nextLimit === "unlimited" ? "unlimited" : nextLimit} OCR imports and digitize your entire inventory.`,
				upgradeText: "OCR imports",
				currentLimit,
				nextLimit,
				benefit:
					"Digitize any printed material in seconds - menus, flyers, catalogs",
				valueProposition: "Turn photos into editable catalogues instantly",
			};
		case "items":
			return {
				feature: "Items",
				icon: Layers,
				description: `Showcase your complete product range! Upgrade to add ${nextLimit === "unlimited" ? "unlimited" : `up to ${nextLimit}`} items per catalogue and never miss a sales opportunity.`,
				upgradeText: "items",
				currentLimit,
				nextLimit,
				benefit:
					"Display your entire inventory - every product deserves visibility",
				valueProposition: "More products = More opportunities",
			};
		case "categories":
			return {
				feature: "Categories",
				icon: FolderTree,
				description: `Better organization drives more sales. Upgrade to create ${nextLimit === "unlimited" ? "unlimited" : nextLimit} categories and help customers find exactly what they need.`,
				upgradeText: "categories",
				currentLimit,
				nextLimit,
				benefit:
					"Perfect organization makes shopping effortless for your customers",
				valueProposition: "Better navigation = Higher conversions",
			};
		default:
			return {
				feature: "Premium Features",
				icon: Lock,
				description:
					"Unlock the full potential of your digital catalogues with premium features designed to grow your business.",
				upgradeText: "features",
				currentLimit: undefined,
				nextLimit: undefined,
				benefit: "Access advanced tools that drive real business results",
				valueProposition: "Professional features for serious growth",
			};
	}
};

const getIcon = (type: LimitType) => {
	switch (type) {
		case "items":
			return Layers;
		case "categories":
			return FolderTree;
		case "traffic":
			return IoSearch;
		case "ai":
			return Sparkles;
		case "ocr":
			return Zap;
		default:
			return Lock;
	}
};

const LimitsModal = ({
	isOpen,
	type = "catalogue",
	currentPlan = tiers[0],
	requiredPlan = tiers[1],
	onClose,
}: LimitsModalProps) => {
	const isTraffic = type === "traffic";
	const content = getLimitContent(type, currentPlan, requiredPlan);
	const IconComponent = getIcon(type);

	return (
		<AlertDialog open={isOpen}>
			<AlertDialogContent className="w-[95vw] max-w-md xl:max-w-lg mx-auto p-0 bg-product-background border border-product-border shadow-product-shadow rounded-lg overflow-hidden">
				{/* Header */}
				<AlertDialogHeader className="relative p-6 sm:p-8 text-center bg-hero-product-background space-y-0">
					{onClose ? (
						<button
							aria-label="Close"
							className="absolute top-4 right-4 text-product-foreground-accent hover:text-product-foreground transition-colors z-10"
							onClick={onClose}
						>
							<svg
								className="w-5 h-5"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path
									d="M6 18L18 6M6 6l12 12"
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
								/>
							</svg>
						</button>
					) : (
						<Link
							aria-label="Go to dashboard"
							className="absolute top-4 right-4 text-product-foreground-accent hover:text-product-foreground transition-colors z-10"
							href="/admin/dashboard"
						>
							<svg
								className="w-5 h-5"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path
									d="M6 18L18 6M6 6l12 12"
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
								/>
							</svg>
						</Link>
					)}

					<div className="flex justify-center mb-4">
						<div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center bg-product-primary shadow-lg">
							{isTraffic ? (
								<IoSearch className="w-8 h-8 sm:w-10 sm:h-10 text-product-secondary" />
							) : (
								<IconComponent className="w-8 h-8 sm:w-10 sm:h-10 text-product-secondary" />
							)}
						</div>
					</div>

					<AlertDialogTitle className="text-xl sm:text-2xl font-bold mb-2 text-product-foreground text-center">
						{isTraffic
							? "Catalogue Not Found"
							: `Need More ${content.feature}?`}
					</AlertDialogTitle>
					<AlertDialogDescription className="text-sm sm:text-base text-product-foreground-accent text-center leading-relaxed">
						{isTraffic
							? "The selected catalogue is inactive or doesn't exist. Join thousands of businesses already using Quicktalog to showcase their offerings digitally."
							: "Upgrade your plan to unlock more features and take your digital catalogues to the next level."}
					</AlertDialogDescription>
				</AlertDialogHeader>

				{/* Content */}
				<div className="p-6 sm:p-8 space-y-6">
					{isTraffic ? (
						<div className="space-y-6">
							{/* Quicktalog Promotional Content */}
							<div className="p-4 sm:p-5 rounded-xl bg-product-hover-background border border-product-border">
								<h3 className="text-base sm:text-lg font-semibold text-product-foreground mb-3">
									Create Your Digital Catalog with Quicktalog
								</h3>
								<ul className="space-y-2 text-sm text-product-foreground-accent">
									<li className="flex items-start">
										<Sparkles className="w-4 h-4 mr-2 mt-0.5 text-product-primary flex-shrink-0" />
										<span>Beautiful, mobile-friendly catalogs in minutes</span>
									</li>
									<li className="flex items-start">
										<Zap className="w-4 h-4 mr-2 mt-0.5 text-product-primary flex-shrink-0" />
										<span>Share via QR codes and get real-time analytics</span>
									</li>
									<li className="flex items-start">
										<TrendingUp className="w-4 h-4 mr-2 mt-0.5 text-product-primary flex-shrink-0" />
										<span>No coding required - start today</span>
									</li>
								</ul>
							</div>
							<Button
								className="w-full h-12 text-base font-semibold"
								variant="cta"
							>
								<Link href={process.env.NEXT_PUBLIC_BASE_URL!} target="_blank">
									Get Started Today
								</Link>
							</Button>
						</div>
					) : (
						<>
							{/* Current vs Next Tier Comparison */}
							<div className="space-y-4">
								{/* Limit Comparison */}
								<div className="w-full max-w-3xl">
									<div className="border-2 border-product-primary flex items-center justify-between p-4 rounded-xl bg-product-hover-background">
										{/* Current Plan */}
										<div className="flex-1 min-w-0">
											<div className="text-xs text-product-foreground-accent mb-2">
												Current Plan
											</div>
											<div className="flex items-baseline space-x-1 mb-1">
												<span className="text-base font-bold text-product-foreground">
													{formatLimit(content.currentLimit)}
												</span>
												<span className="text-sm text-product-foreground">
													{content.feature.toLowerCase()}
												</span>
											</div>
											<div className="text-sm text-product-foreground font-medium">
												{currentPlan.name}
											</div>
										</div>

										{/* Arrow */}
										<div className="px-6 flex-shrink-0">
											<ArrowRight className="w-5 h-5 text-product-primary" />
										</div>

										{/* Required Plan */}
										<div className="flex-1 min-w-0 text-right">
											<div className="text-xs text-product-foreground-accent mb-2">
												Required Plan
											</div>
											<div className="flex items-baseline justify-end space-x-1 mb-1">
												<span className="text-base font-bold text-product-foreground">
													{formatLimit(content.nextLimit)}
												</span>
												<span className="text-sm text-product-foreground">
													{content.feature.toLowerCase()}
												</span>
											</div>
											<div className="text-sm text-product-foreground font-medium">
												{requiredPlan.name}
											</div>
										</div>
									</div>
								</div>

								{/* Key Benefit */}
								<div className="p-4 rounded-xl bg-product-hover-background border-2 border-product-primary">
									<div className="space-y-3">
										<div className="flex items-start space-x-3">
											<div className="w-8 h-8 rounded-lg bg-product-primary flex items-center justify-center flex-shrink-0">
												<Sparkles className="w-4 h-4 text-product-secondary" />
											</div>
											<div>
												<h4 className="font-semibold text-product-foreground mb-1">
													What You'll Get with {requiredPlan.name}
												</h4>
											</div>
										</div>
										<ul className="space-y-2 text-sm text-product-foreground-accent">
											<li className="flex items-start">
												<Layers className="w-4 h-4 mr-2 mt-0.5 text-product-primary flex-shrink-0" />
												<span className="text-product-foreground">
													<strong>
														{formatLimit(requiredPlan.features.catalogues)}
													</strong>{" "}
													{requiredPlan.features.catalogues > 1
														? "catalogues"
														: "catalogue"}{" "}
													with{" "}
													<strong>
														{formatLimit(
															requiredPlan.features.categories_per_catalogue,
														)}
													</strong>{" "}
													categories and{" "}
													<strong>
														{formatLimit(
															requiredPlan.features.items_per_catalogue,
														)}
													</strong>{" "}
													items per catalogue to manage all your product lines
												</span>
											</li>
											{requiredPlan.features.ai_prompts > 0 && (
												<li className="flex items-start">
													<Sparkles className="w-4 h-4 mr-2 mt-0.5 text-product-primary flex-shrink-0" />
													<span className="text-product-foreground">
														<strong className="text-product-foreground">
															{formatLimit(requiredPlan.features.ai_prompts)}
														</strong>{" "}
														AI prompts per month
													</span>
												</li>
											)}
											{currentPlan.features.branding == false &&
											requiredPlan.features.branding == true ? (
												<li className="flex items-start">
													<Sparkles className="w-4 h-4 mr-2 mt-0.5 text-product-primary flex-shrink-0" />
													<span className="font-semibold text-product-foreground">
														Custom Branding
													</span>
												</li>
											) : null}
											{requiredPlan.features.ocr_ai_import > 1 && (
												<li className="flex items-start">
													<Zap className="w-4 h-4 mr-2 mt-0.5 text-product-primary flex-shrink-0" />
													<span className="text-product-foreground">
														<strong>
															{formatLimit(requiredPlan.features.ocr_ai_import)}
														</strong>{" "}
														OCR AI imports to digitize printed materials
													</span>
												</li>
											)}
											<li className="flex items-start">
												<TrendingUp className="w-4 h-4 mr-2 mt-0.5 text-product-primary flex-shrink-0" />
												<span className="text-product-foreground">
													<strong className="text-product-foreground">
														{requiredPlan.features.traffic_limit.toLocaleString()}
													</strong>{" "}
													page views per month to reach more customers
												</span>
											</li>
											{requiredPlan.features.newsletter && (
												<li className="flex items-start">
													<Zap className="w-4 h-4 mr-2 mt-0.5 text-product-primary flex-shrink-0" />
													<span className="text-product-foreground">
														<strong>Newsletter feature</strong> to keep
														customers engaged
													</span>
												</li>
											)}
										</ul>
									</div>
								</div>
							</div>

							{/* CTA Button */}
							<AlertDialogFooter className="sm:justify-center pt-2">
								<Link
									className="w-full group relative py-3 px-6 rounded-xl font-semibold text-base transition-all duration-300 transform hover:scale-[1.02] hover:shadow-lg focus:outline-none focus:ring-3 focus:ring-product-primary/30 bg-product-primary text-product-secondary text-center hover:bg-product-primary-accent"
									href="/pricing"
								>
									<span className="relative z-10 flex items-center justify-center space-x-2">
										<span>Upgrade to {requiredPlan.name} Now</span>
										<ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
									</span>
								</Link>
							</AlertDialogFooter>
						</>
					)}
				</div>
			</AlertDialogContent>
		</AlertDialog>
	);
};

export default LimitsModal;
