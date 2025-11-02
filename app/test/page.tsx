"use client";
import { tiers } from "@quicktalog/common";
import { useState } from "react";
import UpgradePlanModal from "@/components/modals/UpgradePlanModal";
import { Button } from "@/components/ui/button";

const TestPage = () => {
	const [showUpgradeModal, setShowUpgradeModal] = useState(false);
	const [currentPlanIndex, setCurrentPlanIndex] = useState(0);
	const [requiredPlanIndex, setRequiredPlanIndex] = useState(1);
	const [limitType, setLimitType] = useState<"items" | "categories">("items");

	return (
		<div className="min-h-screen bg-product-background p-8">
			<div className="max-w-4xl mx-auto">
				<h1 className="text-4xl font-bold text-product-foreground mb-8 font-heading">
					Upgrade Plan Modal Test
				</h1>

				<div className="bg-white rounded-xl border border-product-border p-6 mb-6 shadow-product-shadow">
					<h2 className="text-xl font-semibold text-product-foreground mb-4 font-heading">
						Configuration
					</h2>

					<div className="space-y-4">
						{/* Current Plan Selection */}
						<div>
							<label className="block text-sm font-medium text-product-foreground mb-2">
								Current Plan
							</label>
							<select
								className="w-full px-4 py-2 border border-product-border rounded-lg bg-product-background text-product-foreground"
								onChange={(e) => setCurrentPlanIndex(Number(e.target.value))}
								value={currentPlanIndex}
							>
								{tiers.map((tier, index) => (
									<option
										key={`test-pricing-${index}-${tier.priceId}`}
										value={index}
									>
										{tier.name}
									</option>
								))}
							</select>
						</div>

						{/* Required Plan Selection */}
						<div>
							<label className="block text-sm font-medium text-product-foreground mb-2">
								Required Plan
							</label>
							<select
								className="w-full px-4 py-2 border border-product-border rounded-lg bg-product-background text-product-foreground"
								onChange={(e) => setRequiredPlanIndex(Number(e.target.value))}
								value={requiredPlanIndex}
							>
								{tiers.map((tier, index) => (
									<option key={`test-price-${index}`} value={index}>
										{tier.name}
									</option>
								))}
							</select>
						</div>

						{/* Limit Type Selection */}
						<div>
							<label className="block text-sm font-medium text-product-foreground mb-2">
								Limit Type
							</label>
							<div className="flex gap-4">
								<label className="flex items-center">
									<input
										checked={limitType === "items"}
										className="mr-2"
										onChange={(e) =>
											setLimitType(e.target.value as "items" | "categories")
										}
										type="radio"
										value="items"
									/>
									Items
								</label>
								<label className="flex items-center">
									<input
										checked={limitType === "categories"}
										className="mr-2"
										onChange={(e) =>
											setLimitType(e.target.value as "items" | "categories")
										}
										type="radio"
										value="categories"
									/>
									Categories
								</label>
							</div>
						</div>
					</div>
				</div>

				{/* Test Button */}
				<Button
					className="w-full py-4 text-lg"
					onClick={() => setShowUpgradeModal(true)}
					variant="cta"
				>
					Open Upgrade Modal
				</Button>

				{/* Current Configuration Display */}
				<div className="mt-6 bg-product-hover-background rounded-lg p-4 border border-product-border">
					<h3 className="text-sm font-semibold text-product-foreground mb-2">
						Current Configuration:
					</h3>
					<ul className="text-sm text-product-foreground-accent space-y-1">
						<li>
							<strong>Current Plan:</strong> {tiers[currentPlanIndex].name}
						</li>
						<li>
							<strong>Required Plan:</strong> {tiers[requiredPlanIndex].name}
						</li>
						<li>
							<strong>Limit Type:</strong> {limitType}
						</li>
					</ul>
				</div>
			</div>

			{/* Upgrade Modal */}
			<UpgradePlanModal
				currentPlan={tiers[currentPlanIndex]}
				isOpen={showUpgradeModal}
				limitType={limitType}
				onClose={() => setShowUpgradeModal(false)}
				requiredPlan={tiers[requiredPlanIndex]}
				userEmail="test@example.com"
			/>
		</div>
	);
};

export default TestPage;
