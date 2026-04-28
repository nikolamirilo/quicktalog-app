import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, Star, X } from "lucide-react";

export interface BillingHistoryProps {
	expandedFeatures: Record<string, any>;
}

const FEATURE_LABELS: Record<string, string> = {
	support: "Support",
	catalogues: "Catalogues",
	newsletter: "Newsletter",
	ocr_ai_import: "OCR AI Import",
	traffic_limit: "Traffic Limit",
	branding: "Branding",
	custom_features: "Custom Features",
	analytics: "Analytics",
	ai_prompts: "AI Prompts",
	blocks_per_catalogue: "Blocks per Catalogue",
	items_per_catalogue: "Items per Catalogue",
	styles: "Style",
	standardThemes: "Standard Themes",
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

const formatFeatureValue = (key: string, value: any): string => {
	if (value === null || value === 0) return "Not included";
	if (typeof value === "boolean") return value ? "Included" : "Not included";
	if (typeof value === "number") {
		if (key === "traffic_limit") return `${value.toLocaleString()} views/month`;
		if (key === "catalogues")
			return `${value} catalogue${value !== 1 ? "s" : ""}`;
		if (key === "ocr_ai_import")
			return `${value} OCR AI import${value !== 1 ? "s" : ""}`;
		if (key === "ai_prompts")
			return `${value} AI generation${value !== 1 ? "s" : ""}`;
		return value.toString();
	}
	return String(value);
};

const isFeatureIncluded = (value: any) => {
	if (value === null || value === false || value === 0) return false;
	if (typeof value === "boolean") return value;
	if (typeof value === "number") return value > 0;
	if (typeof value === "string") return value.toLowerCase() !== "not included";
	return true;
};

export default function BillingHistory({
	expandedFeatures,
}: BillingHistoryProps) {
	return (
		<Card className="bg-product-background shadow-product-shadow">
			<CardHeader className="pb-4">
				<CardTitle className="text-xl font-bold flex items-center gap-2 text-product-foreground">
					<Star className="w-5 h-5 text-product-icon" />
					Plan Features
				</CardTitle>
			</CardHeader>
			<CardContent>
				<div className="grid md:grid-cols-2 gap-4">
					{Object.entries(expandedFeatures)
						.sort(([_, aValue], [__, bValue]) => {
							const aIncluded = isFeatureIncluded(aValue) ? 0 : 1;
							const bIncluded = isFeatureIncluded(bValue) ? 0 : 1;
							return aIncluded - bIncluded;
						})
						.map(([key, value]) => {
							const included = isFeatureIncluded(value);
							return (
								<div
									className={`flex items-center space-x-3 p-3 rounded-lg transition-colors ${
										included
											? "bg-product-background border border-product-primary"
											: "bg-product-background border border-product-border"
									}`}
									key={key}
								>
									{included ? (
										<CheckCircle className="w-5 h-5 text-product-primary flex-shrink-0" />
									) : (
										<X className="w-5 h-5 text-product-foreground-accent flex-shrink-0" />
									)}
									<div className="flex-1">
										<p className="font-medium text-product-foreground">
											{formatFeatureKey(key)}
										</p>
										<p
											className={`text-sm ${
												included
													? "text-product-primary-foreground"
													: "text-product-foreground-accent"
											}`}
										>
											{formatFeatureValue(key, value)}
										</p>
									</div>
								</div>
							);
						})}
				</div>
			</CardContent>
		</Card>
	);
}
