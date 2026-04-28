import { LimitType, PricingPlan } from "@quicktalog/common";
import { FolderTree, Layers, Lock, Sparkles, Zap } from "lucide-react";
import { IoSearch } from "react-icons/io5";
import { TbBrandGoogleAnalytics } from "react-icons/tb";

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
	return limit.toLocaleString();
};

export const getIcon = (type: LimitType) => {
	switch (type) {
		case "items":
			return Layers;
		case "categories":
			return FolderTree;
		case "notFound":
			return IoSearch;
		case "traffic":
			return TbBrandGoogleAnalytics;
		case "ai":
			return Sparkles;
		case "ocr":
			return Zap;
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
				return currentPlan.features.ai_prompts;
			case "catalogue":
				return currentPlan.features.catalogues;
			case "ocr":
				return currentPlan.features.ocr_ai_import;
			case "items":
				return currentPlan.features.items_per_catalogue;
			case "categories":
				return currentPlan.features.blocks_per_catalogue;
			case "traffic":
				return currentPlan.features.traffic_limit;
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
				return requiredPlan.features?.blocks_per_catalogue;
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
		case "traffic":
			return {
				feature: "Traffic",
				icon: FolderTree,
				description: `Better organization drives more sales. Upgrade to create ${nextLimit === "unlimited" ? "unlimited" : nextLimit} categories and help customers find exactly what they need.`,
				upgradeText: "traffic",
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
