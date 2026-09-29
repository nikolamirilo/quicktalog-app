import { LimitType, PricingPlan } from "@quicktalog/common";
import {
	ChartColumn,
	FolderTree,
	Layers,
	Lock,
	Search,
	Sparkles,
} from "lucide-react";

export interface LimitContentData {
	feature: string;
	icon: typeof Lock;
	description: string;
	upgradeText: string;
	currentLimit: number | "unlimited" | undefined;
	nextLimit: number | "unlimited" | undefined;
	benefit: string;
	valueProposition: string;
}

export const formatLimit = (limit: number | "unlimited" | undefined) => {
	if (limit === "unlimited") return "Unlimited";
	if (limit === undefined) return "N/A";
	return limit.toLocaleString("en-US");
};

export const getIcon = (type: LimitType) => {
	switch (type) {
		case "items":
			return Layers;
		case "sections":
			return FolderTree;
		case "notFound":
			return Search;
		case "traffic":
			return ChartColumn;
		case "ai":
			return Sparkles;
		default:
			return Lock;
	}
};

export const getLimitContent = (
	type: LimitType,
	currentPlan?: PricingPlan,
	requiredPlan?: PricingPlan,
): LimitContentData => {
	const getCurrentLimit = () => {
		switch (type) {
			case "ai":
				return currentPlan.features.ai_credits;
			case "catalogue":
				return currentPlan.features.catalogues;
			case "items":
				return currentPlan.features.items_per_catalogue;
			case "sections":
				return currentPlan.features.sections_per_catalogue;
			case "traffic":
				return currentPlan.features.traffic_limit;
			default:
				return undefined;
		}
	};

	const getNextLimit = () => {
		switch (type) {
			case "ai":
				return requiredPlan.features?.ai_credits;
			case "catalogue":
				return requiredPlan.features?.catalogues;
			case "items":
				return requiredPlan.features?.items_per_catalogue;
			case "sections":
				return requiredPlan.features?.sections_per_catalogue;
			case "traffic":
				return requiredPlan.features?.traffic_limit;
			default:
				return undefined;
		}
	};

	const currentLimit = getCurrentLimit();
	const nextLimit = getNextLimit();

	switch (type) {
		case "ai":
			return {
				feature: "AI Credits",
				icon: Sparkles,
				// Running out mid-build is the conversion moment, so a free user is
				// told what they already get rather than only what they are missing.
				description:
					currentLimit === 0 || currentPlan?.id === 0
						? `You get ${currentLimit} free AI credits a month. ${nextLimit === "unlimited" ? "Upgrading" : `Upgrading gives you ${nextLimit}`} - enough to build and refine a full catalogue by chatting.`
						: `You have used all ${currentLimit} AI credits this month. Upgrade to ${nextLimit === "unlimited" ? "unlimited" : nextLimit} and keep going.`,
				upgradeText: "AI credits",
				currentLimit,
				nextLimit,
				benefit:
					"One credit writes an item description; a whole menu costs about five",
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
		case "sections":
			return {
				feature: "Sections",
				icon: FolderTree,
				description: `Better organization drives more sales. Upgrade to create ${nextLimit === "unlimited" ? "unlimited" : nextLimit} categories and help customers find exactly what they need.`,
				upgradeText: "sections",
				currentLimit,
				nextLimit,
				benefit:
					"Perfect organization makes shopping effortless for your customers",
				valueProposition: "Better navigation = Higher conversions",
			};
		case "traffic":
			return {
				feature: "Traffic",
				icon: FolderTree,
				description: `Your catalogue is getting noticed! Upgrade to get ${nextLimit === "unlimited" ? "unlimited" : nextLimit.toLocaleString("en-US")} page views per month and keep serving customers without interruption.`,
				upgradeText: "traffic",
				currentLimit,
				nextLimit,
				benefit: "Handle more visitors without your catalogue going offline",
				valueProposition: "More traffic capacity = More potential customers",
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
