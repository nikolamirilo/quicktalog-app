import { PricingPlan } from "@quicktalog/common";
import { ArrowRight, Layers, Sparkles, TrendingUp, Zap } from "lucide-react";
import Link from "next/link";
import { BiCustomize } from "react-icons/bi";
import { AlertDialogFooter } from "@/components/ui/alert-dialog";
import { LimitContentData, formatLimit } from "./limitContent";

interface PlanComparisonProps {
	content: LimitContentData;
	currentPlan: PricingPlan;
	requiredPlan: PricingPlan;
	isStandardPlanLimitReached: boolean;
}

const PlanComparison = ({
	content,
	currentPlan,
	requiredPlan,
	isStandardPlanLimitReached,
}: PlanComparisonProps) => {
	const featureLabel =
		content.feature === "AI Catalogue Generation"
			? "AI prompts"
			: content.feature === "OCR AI Import"
				? "OCR imports"
				: content.feature.toLowerCase();

	return (
		<>
			{/* Current vs Next Tier Comparison */}
			<div className="space-y-4">
				{/* Limit Comparison */}
				<div className="w-full max-w-3xl">
					<div className="border-2 border-product-primary flex items-center justify-between p-3 sm:p-4 rounded-xl bg-product-background-hover">
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
									{featureLabel}
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
									{isStandardPlanLimitReached
										? "TBD"
										: formatLimit(content.nextLimit)}
								</span>
								<span className="text-sm text-product-foreground">
									{featureLabel}
								</span>
							</div>
							<div className="text-sm text-product-foreground font-medium">
								{isStandardPlanLimitReached ? "Custom Plan" : requiredPlan.name}
							</div>
						</div>
					</div>
				</div>

				{!isStandardPlanLimitReached ? (
					<div className="p-3 sm:p-4 rounded-xl bg-product-background-hover border-2 border-product-primary">
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
											{formatLimit(requiredPlan.features.blocks_per_catalogue)}
										</strong>{" "}
										categories and{" "}
										<strong>
											{formatLimit(requiredPlan.features.items_per_catalogue)}
										</strong>{" "}
										items per catalogue to manage all your product lines
									</span>
								</li>

								{requiredPlan.features.ai_prompts > 0 && (
									<li className="flex items-start">
										<Sparkles className="w-4 h-4 mr-2 mt-0.5 text-product-primary flex-shrink-0" />
										<span className="text-product-foreground">
											<strong>
												{formatLimit(requiredPlan.features.ai_prompts)}
											</strong>{" "}
											AI prompts per month
										</span>
									</li>
								)}

								{currentPlan.features.branding === false &&
									requiredPlan.features.branding === true && (
										<li className="flex items-start">
											<Sparkles className="w-4 h-4 mr-2 mt-0.5 text-product-primary flex-shrink-0" />
											<span className="font-semibold text-product-foreground">
												Custom Branding
											</span>
										</li>
									)}

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
										<strong>
											{requiredPlan.features.traffic_limit.toLocaleString()}
										</strong>{" "}
										page views per month to reach more customers
									</span>
								</li>

								{requiredPlan.features.newsletter && (
									<li className="flex items-start">
										<Zap className="w-4 h-4 mr-2 mt-0.5 text-product-primary flex-shrink-0" />
										<span className="text-product-foreground">
											<strong>Newsletter feature</strong> to keep customers
											engaged
										</span>
									</li>
								)}
							</ul>
						</div>
					</div>
				) : (
					<div className="p-3 sm:p-4 rounded-xl bg-product-background-hover border-2 border-product-primary">
						<div className="flex items-start space-x-3">
							<div className="w-8 h-8 rounded-lg bg-product-primary flex items-center justify-center flex-shrink-0 mt-1">
								<BiCustomize className="w-4 h-4 text-product-secondary" />
							</div>
							<div>
								<h4 className="font-semibold text-product-foreground mb-1">
									Purchase Custom Plan
								</h4>
								<p className="text-sm text-product-foreground-accent">
									Get limits and features fully tailored to your needs. Contact
									our team to get more information.
								</p>
							</div>
						</div>
					</div>
				)}
			</div>

			{content.currentLimit === content.nextLimit ? (
				<AlertDialogFooter className="sm:justify-center pt-2">
					<Link
						className="w-full group relative py-2.5 sm:py-3 px-6 rounded-xl font-semibold text-base transition-all duration-300 transform hover:scale-[1.02] hover:shadow-lg focus:outline-none focus:ring-3 focus:ring-product-primary/30 bg-product-primary text-product-secondary text-center "
						href="/contact"
					>
						<span className="relative z-10 flex items-center justify-center space-x-2">
							<span>Contact us Now</span>
							<ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
						</span>
					</Link>
				</AlertDialogFooter>
			) : (
				<AlertDialogFooter className="sm:justify-center pt-2">
					<Link
						className="w-full group relative py-2.5 sm:py-3 px-6 rounded-xl font-semibold text-base transition-all duration-300 transform hover:scale-[1.02] hover:shadow-lg focus:outline-none focus:ring-3 focus:ring-product-primary/30 bg-product-primary text-product-secondary text-center "
						href="/pricing"
					>
						<span className="relative z-10 flex items-center justify-center space-x-2">
							<span>Upgrade to {requiredPlan.name} Now</span>
							<ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
						</span>
					</Link>
				</AlertDialogFooter>
			)}
		</>
	);
};

export default PlanComparison;
