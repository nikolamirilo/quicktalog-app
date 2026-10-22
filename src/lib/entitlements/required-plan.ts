import { LimitType, PricingPlan, tiers as allTiers } from "@quicktalog/common";

export function getRequiredPlan(
	currentPlan: PricingPlan,
	limitType: LimitType,
	tiersList: PricingPlan[] = allTiers,
): PricingPlan {
	const standardPlans = tiersList
		.filter((t) => t.type === "standard")
		.sort((a, b) => a.id - b.id);

	const lastStandard = standardPlans[standardPlans.length - 1];

	if (limitType === "notFound") return lastStandard;

	const getValue = (plan: PricingPlan): number | "unlimited" | undefined => {
		switch (limitType) {
			case "items":
				return plan.features.items_per_catalogue;
			case "sections":
				return plan.features.sections_per_catalogue;
			case "catalogue":
				return plan.features.catalogues;
			case "ai":
				return plan.features.ai_credits;
			case "traffic":
				return plan.features.traffic_limit;
			default:
				return undefined;
		}
	};

	const currentValue = getValue(currentPlan);
	const isCustomPlan = currentPlan.type !== "standard";

	const better = standardPlans.find((plan) => {
		if (!isCustomPlan && plan.id <= currentPlan.id) return false;
		const v = getValue(plan);
		if (v === undefined || currentValue === undefined) return false;
		if (currentValue === "unlimited") return false;
		if (v === "unlimited") return true;
		return (v as number) > (currentValue as number);
	});

	return better ?? lastStandard;
}
