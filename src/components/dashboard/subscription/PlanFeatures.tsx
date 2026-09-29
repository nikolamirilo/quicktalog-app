import { Check, Star, X } from "lucide-react";

import { AppSectionTitle } from "@/components/dashboard/common/AppHeadings";
import { cn } from "@/lib/ui/cn";

type PlanFeaturesProps = {
	/** Feature key to value, with the nested groups already flattened. */
	features: Record<string, unknown>;
};

const FEATURE_LABELS: Record<string, string> = {
	support: "Support",
	catalogues: "Catalogues",
	newsletter: "Newsletter",
	traffic_limit: "Traffic Limit",
	branding: "Branding",
	custom_features: "Custom Features",
	analytics: "Analytics",
	ai_credits: "AI Credits",
	sections_per_catalogue: "Sections per Catalogue",
	items_per_catalogue: "Items per Catalogue",
	styles: "Style",
	standardThemes: "Standard Themes",
	customThemes: "Custom Themes",
	divider: "Content Divider",
	embedding: "External Content",
	customCode: "Custom Code",
};

const formatFeatureKey = (key: string) => {
	return (
		FEATURE_LABELS[key] ??
		key
			.split("_")
			.map((word) => {
				const upperWord = word.toUpperCase();
				if (upperWord === "AI" || upperWord === "OCR") return upperWord;
				return word.charAt(0).toUpperCase() + word.slice(1);
			})
			.join(" ")
	);
};

const formatFeatureValue = (key: string, value: unknown): string => {
	if (value === null || value === 0) return "Not included";
	if (typeof value === "boolean") return value ? "Included" : "Not included";
	if (typeof value === "number") {
		if (key === "traffic_limit")
			return `${value.toLocaleString("en-US")} views/month`;
		if (key === "catalogues")
			return `${value} catalogue${value !== 1 ? "s" : ""}`;
		if (key === "ai_credits")
			return `${value} AI credit${value !== 1 ? "s" : ""}`;
		return value.toString();
	}
	return String(value);
};

const isFeatureIncluded = (value: unknown) => {
	if (value === null || value === false || value === 0) return false;
	if (typeof value === "boolean") return value;
	if (typeof value === "number") return value > 0;
	if (typeof value === "string") return value.toLowerCase() !== "not included";
	return true;
};

/** The current plan's features, included ones first (`.as-feat`). */
export function PlanFeatures({ features: planFeatures }: PlanFeaturesProps) {
	const features = Object.entries(planFeatures).sort(
		([, aValue], [, bValue]) =>
			(isFeatureIncluded(aValue) ? 0 : 1) - (isFeatureIncluded(bValue) ? 0 : 1),
	);

	return (
		<section
			aria-labelledby="plan-features-h"
			className="rounded-product-card border border-product-border bg-product-card p-5 shadow-product md:p-6"
		>
			<AppSectionTitle className="mb-4" icon={<Star />} id="plan-features-h">
				Plan Features
			</AppSectionTitle>
			<ul className="grid grid-cols-1 gap-2.5 md:grid-cols-2">
				{features.map(([key, value]) => {
					const included = isFeatureIncluded(value);
					return (
						<li
							className={cn(
								"flex items-center gap-3 rounded-[14px] border bg-product-card px-3.5 py-3",
								included
									? "border-product-primary/60"
									: "border-product-border",
							)}
							key={key}
						>
							{included ? (
								<span className="grid h-[22px] w-[22px] flex-none place-items-center rounded-full bg-product-primary-soft text-product-primary-ink">
									<Check
										aria-hidden="true"
										className="size-3.5"
										strokeWidth={3}
									/>
								</span>
							) : (
								<X
									aria-hidden="true"
									className="size-5 flex-none text-product-muted"
								/>
							)}
							<span className="min-w-0">
								<b className="block text-[14.5px] font-semibold">
									{formatFeatureKey(key)}
								</b>
								<small
									className={cn(
										"block text-[13px]",
										included
											? "text-product-foreground-accent"
											: "text-product-muted",
									)}
								>
									{formatFeatureValue(key, value)}
								</small>
							</span>
						</li>
					);
				})}
			</ul>
		</section>
	);
}
