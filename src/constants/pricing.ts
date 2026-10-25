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

type Features = PricingPlan["features"];
type LimitValue = number | "unlimited" | undefined;

export type PlanLimitRow = {
	label: string;
	/** The label as it reads after a number on a plan card. */
	unit: string;
	type: string;
	value: LimitValue;
};

export type PlanFeatureRow = {
	label: string;
	/** `true`/`false` for on/off features, a string for tiered ones ("Basic"). */
	value: boolean | string;
	/** Set on the rows a plan card highlights; also the info-dialog key. */
	type?: string;
};

export const formatPlanLimit = (value: LimitValue) => {
	if (value === "unlimited") return "Unlimited";
	if (value === undefined) return "–";
	return value.toLocaleString("en-US");
};

/** Plan limits, shared by the subscription overview and the plan cards. */
export const planLimitRows = (f: Features): PlanLimitRow[] => [
	{
		label: "Catalogues",
		unit: f.catalogues === 1 ? "catalogue" : "catalogues",
		type: "catalogues",
		value: f.catalogues,
	},
	{
		label: "Sections per catalogue",
		unit: "sections per catalogue",
		type: "sections_and_items",
		value: f.sections_per_catalogue,
	},
	{
		label: "Items per catalogue",
		unit: "items per catalogue",
		type: "items_per_catalogue",
		value: f.items_per_catalogue,
	},
	{
		label: "Page views / month",
		unit: "page views / month",
		type: "traffic-limit",
		value: f.traffic_limit,
	},
	{
		label: "AI credits / month",
		unit: "AI credits / month",
		type: "ai-catalogue-generation",
		value: f.ai_credits,
	},
];

/** What a plan includes, by area, as the subscription overview lists it. */
export const planFeatureGroups = (
	f: Features,
): { title: string; rows: PlanFeatureRow[] }[] => [
	{
		title: "Design",
		rows: [
			{ label: "Standard themes", value: true },
			{
				label: "Advanced styling",
				value: f.advancedAppearance,
				type: "advanced_styling",
			},
			{ label: "Custom branding", value: f.branding, type: "custom_branding" },
		],
	},
	{
		title: "Section types",
		rows: [
			{ label: "Items", value: true },
			{ label: "Text", value: true },
			{ label: "Divider", value: f.sections.divider },
			{ label: "External content", value: f.sections.embedding },
			{ label: "Custom visual", value: f.sections.customVisual },
		],
	},
	{
		title: "Growth & support",
		rows: [
			{ label: "Analytics", value: f.analytics, type: "analytics" },
			// Named "tags" to separate it from the row above, which is the
			// built-in dashboard analytics tier.
			{
				label: "Your own analytics tags",
				value: f.integrations.tracking,
				type: "analytics_tags",
			},
			{
				label: "Newsletter sign-ups",
				value: f.newsletter,
				type: "newsletter",
			},
			{ label: "Support", value: f.support, type: "support" },
			{
				label: "Custom features",
				value: f.custom_features,
				type: "custom-features",
			},
		],
	},
];

export const isFeatureIncluded = (value: PlanFeatureRow["value"]) =>
	typeof value === "string" ? value.toLowerCase() !== "not included" : value;

/** "Basic" analytics → "Basic analytics"; "Email support" stays as it is. */
const highlightText = ({ label, value }: PlanFeatureRow) => {
	if (typeof value !== "string") return label;
	return value.toLowerCase().includes(label.toLowerCase())
		? value
		: `${value} ${label.toLowerCase()}`;
};

/** Feature lines on a plan card: the overview's limits, then its highlights. */
export function getFeatureList(features: Features): PlanFeature[] {
	const limits = planLimitRows(features)
		.filter((row) => row.value !== 0)
		.map((row) => ({
			text: `${formatPlanLimit(row.value)} ${row.unit}`,
			type: row.type,
		}));
	const highlights = planFeatureGroups(features)
		.flatMap((group) => group.rows)
		.filter((row) => row.type && isFeatureIncluded(row.value))
		.map((row) => ({ text: highlightText(row), type: row.type as string }));
	return [...limits, ...highlights];
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
		"The number of sections allowed in each catalogue. Higher tiers allow more for complex menus or product lists.",
	items_per_catalogue:
		"The total number of items allowed in each catalogue, across all its sections.",
	advanced_styling:
		"Create your own color themes instead of picking a standard one, and fine-tune fonts, text size, corner radius, shadows, overlays, the glass effect and a custom page background (photo, gradient or colour).",
	analytics_tags:
		"Connect your own Google Analytics or Meta Pixel to a catalogue to track visits in your own tools.",
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
				value: () => true,
			},
			{
				label: "Custom branding",
				hint: "Logo, contact details, metadata, custom header & footer",
				value: (tier) => tier.features.branding,
			},
			{
				label: "Advanced styling",
				hint: "Your own colour themes, fonts, shapes, glass & background",
				value: (tier) => tier.features.advancedAppearance,
			},
		],
	},
	{
		title: "Section types",
		rows: [
			{
				label: "Items section",
				hint: "Your products or services, with prices and photos",
				value: () => true,
			},
			{
				label: "Text section",
				hint: "Rich text for a welcome note, opening hours or a story",
				value: () => true,
			},
			{
				label: "Divider section",
				hint: "A visual separator with adjustable spacing and border",
				value: (tier) => tier.features.sections.divider,
			},
			{
				label: "External content section",
				hint: "Maps, video, booking widgets",
				value: (tier) => tier.features.sections.embedding,
			},
			{
				label: "Custom visual section",
				hint: "Banners, animations and interactive objects you design yourself",
				value: (tier) => tier.features.sections.customVisual,
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
				// Distinct from the row above, which is the built-in dashboard
				// analytics tier.
				label: "Your own analytics tags",
				hint: "Connect your Google Analytics or Meta Pixel to a catalogue",
				value: (tier) => tier.features.integrations.tracking,
			},
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
	`All ${themes.length} standard themes`,
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
