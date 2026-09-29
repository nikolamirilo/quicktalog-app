import { type PricingPlan, themes, tiers } from "@quicktalog/common";

export type BillingCycle = "monthly" | "yearly";

export type PlanFeature = { text: string; type: string };

/** The standard plans in display order: Starter first, then the paid tiers. */
export const standardTiers = tiers.filter((tier) => tier.type === "standard");
export const FREE_TIER_ID = 0;
export const starterTier = standardTiers.find(
	(tier) => tier.id === FREE_TIER_ID,
) as PricingPlan;
export const paidTiers = standardTiers.filter(
	(tier) => tier.id !== FREE_TIER_ID,
);
export const POPULAR_TIER_ID = 2;

export const isFreeTier = (tier: PricingPlan) => tier.id === FREE_TIER_ID;

export const priceIdFor = (tier: PricingPlan, cycle: BillingCycle) =>
	cycle === "monthly" ? tier.priceId.month : tier.priceId.year;

/** Feature lines shown on a plan card, all derived from `tiers`. */
export function getFeatureList(
	features: PricingPlan["features"],
): PlanFeature[] {
	const list: (PlanFeature | null)[] = [
		{
			text: `${features.catalogues} ${features.catalogues > 1 ? "catalogues" : "catalogue"}`,
			type: "catalogues",
		},
		{
			text:
				features.sections_per_catalogue === "unlimited"
					? "Unlimited sections & items"
					: `Up to ${features.sections_per_catalogue} sections & ${features.items_per_catalogue} items per catalogue`,
			type: "sections_and_items",
		},
		features.branding
			? { text: "Custom Branding", type: "custom_branding" }
			: null,
		{
			text: `${features.traffic_limit.toLocaleString("en-US")} page views per month`,
			type: "traffic-limit",
		},
		features.ai_credits === 0
			? null
			: {
					text: `${features.ai_credits} AI credits per month`,
					type: "ai-catalogue-generation",
				},
		features.newsletter ? { text: "Newsletter", type: "newsletter" } : null,
		features.custom_features
			? { text: "Custom features", type: "custom-features" }
			: null,
		{ text: features.support, type: "support" },
	];
	return list.filter((feature): feature is PlanFeature => feature !== null);
}

const explanations: Record<string, string> = {
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
		"AI assistance that helps create & edit your digital catalogues. Describe your services and the AI generates professional descriptions and organizes items into sections for your catalog.",
	newsletter:
		"Email collection system integrated into your catalogs. Visitors can subscribe to receive updates, and you can send newsletters to your subscriber list.",
	"custom-features":
		"Direct access to our development team to request custom features and integrations tailored to your specific business needs. Contact us to discuss specialized functionality beyond standard catalog features.",
	sections_and_items:
		"The total number of sections and items allowed in each catalogue. Higher tiers unlock unlimited organization for complex menus or product lists.",
	custom_branding:
		"Control over the visual branding of your catalogues, including logo upload, legal information, partners and contact information represent your business in the best possible way.",
};

export const getFeatureExplanation = (feature: string) =>
	explanations[feature] ?? "Information about this feature.";

/** "traffic-limit" → "Traffic Limit Explained" (same wording as before). */
export const getFeatureTitle = (feature: string) =>
	`${feature
		.replace(/-/g, " ")
		.replace(/\b\w/g, (letter) => letter.toUpperCase())
		.split("_")
		.join(" ")} Explained`;

export type ComparisonValue = boolean | string | number;
export type ComparisonRow = {
	label: string;
	hint?: string;
	value: (tier: PricingPlan) => ComparisonValue;
};
export type ComparisonGroup = { title: string; rows: ComparisonRow[] };

const limit = (value: number | "unlimited" | undefined) =>
	value === "unlimited" ? "Unlimited" : (value ?? "–");

/**
 * Comparison table rows; every plan fact comes from `tiers`. The price row is
 * not a group: the table renders it on its own above these.
 */
export const comparisonGroups: ComparisonGroup[] = [
	{
		title: "Usage limits",
		rows: [
			{ label: "Catalogues", value: (tier) => tier.features.catalogues },
			{
				label: "Sections per catalogue",
				value: (tier) => limit(tier.features.sections_per_catalogue),
			},
			{
				label: "Items per catalogue",
				value: (tier) => limit(tier.features.items_per_catalogue),
			},
			{
				label: "Page views per month",
				value: (tier) => tier.features.traffic_limit.toLocaleString("en-US"),
			},
		],
	},
	{
		title: "Design & branding",
		rows: [
			{
				label: `Standard themes (${themes.length})`,
				value: (tier) => tier.features.apperance.standardThemes,
			},
			{
				label: "Custom branding",
				hint: "Logo, contact details, metadata, custom header & footer",
				value: (tier) => tier.features.branding,
			},
			{
				label: "Style controls",
				hint: "Font, size, radius, shadow, overlay",
				value: (tier) => tier.features.apperance.styles,
			},
		],
	},
	{
		title: "Section types",
		rows: [
			{
				label: "Divider section",
				value: (tier) => tier.features.sections.divider,
			},
			{
				label: "External content section",
				hint: "Maps, video, booking widgets",
				value: (tier) => tier.features.sections.embedding,
			},
			{
				label: "Custom code section",
				value: (tier) => tier.features.sections.customCode,
			},
		],
	},
	{
		title: "Quick AI",
		rows: [
			{
				label: "AI credits per month",
				hint: "Quick AI in the builder and the description writer",
				value: (tier) => tier.features.ai_credits,
			},
		],
	},
	{
		title: "Sharing & insights",
		rows: [
			{ label: "Shareable link", value: () => true },
			{
				label: "QR code editor",
				hint: "PNG, SVG, JPEG downloads",
				value: () => true,
			},
			{ label: "Analytics", value: (tier) => tier.features.analytics },
			{
				label: "Newsletter sign-ups",
				value: (tier) => tier.features.newsletter,
			},
		],
	},
	{
		title: "Support",
		rows: [
			{ label: "Support", value: (tier) => tier.features.support },
			{
				label: "Custom features on request",
				value: (tier) => tier.features.custom_features,
			},
		],
	},
];

/** Extra lines on the pricing page's starter card that are not plan limits. */
export const starterExtraFeatures = [
	...(starterTier.features.apperance.standardThemes
		? [`All ${themes.length} standard themes`]
		: []),
	"QR code editor & shareable link",
];

/** Features listed on the custom-plan strips. */
export const customPlanFeatures = {
	home: [
		"Unlimited catalogs",
		"Custom branding",
		"Advanced analytics",
		"Priority support",
	],
	pricing: [
		"Higher limits",
		"Custom features & integrations",
		"Priority support",
	],
};
