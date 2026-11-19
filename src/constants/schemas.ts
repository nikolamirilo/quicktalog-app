import type { ArticleMeta } from "@/content/articles/_types";
import type { ManualPageMeta } from "@/content/manual/_types";
import { z } from "zod";
import {
	FRAME_TEXT_MAX,
	HEX_COLOR,
	isUploadedLogoUrl,
	LOGO_URL_MAX,
} from "@/lib/qr/design";
import { parsePrice } from "@/lib/format/price";
import { standardTiers } from "./pricing";
import { pricingFaqs } from "./pricingFaqs";
import { faqs } from "./details";

const organizationSchema = {
	"@context": "https://schema.org",
	"@type": "Organization",
	name: "Quicktalog",
	url: "https://www.quicktalog.app",
	logo: "https://www.quicktalog.app/images/brand/logo.svg",
	description:
		"Quicktalog empowers businesses to create, manage, and share interactive digital catalogues for products and services.",
	foundingDate: "2024",
	contactPoint: {
		"@type": "ContactPoint",
		email: "quicktalog@outlook.com",
		contactType: "customer service",
	},
	sameAs: ["https://www.linkedin.com/company/quicktalog"],
	address: {
		"@type": "PostalAddress",
		addressCountry: "US",
	},
};

const websiteSchema = {
	"@context": "https://schema.org",
	"@type": "WebSite",
	name: "Quicktalog",
	url: "https://www.quicktalog.app",
	description:
		"Create stunning digital catalogues in minutes with our free online catalogue maker. Perfect for restaurants, salons, gyms, retail & more.",
	publisher: {
		"@type": "Organization",
		name: "Quicktalog",
		logo: "https://www.quicktalog.app/images/brand/logo.svg",
	},
	potentialAction: {
		"@type": "SearchAction",
		target: "https://www.quicktalog.app/search?q={search_term_string}",
		"query-input": "required name=search_term_string",
	},
};

const homePageSchema = {
	"@context": "https://schema.org",
	"@type": "WebPage",
	name: "Quicktalog - Create Stunning Digital Catalogues in Minutes",
	description:
		"The best free online catalogue maker for businesses. Turn your services, menus, or products into an interactive, mobile-friendly digital catalogue. No code or design skills required.",
	url: "https://www.quicktalog.app",
	mainEntity: {
		"@type": "SoftwareApplication",
		name: "Quicktalog",
		applicationCategory: "BusinessApplication",
		operatingSystem: "Web Browser",
		description:
			"Free online catalogue maker for creating interactive digital catalogues",
		offers: {
			"@type": "Offer",
			price: "0",
			priceCurrency: "USD",
			description: "Free plan available",
		},
		featureList: [
			"AI-powered catalogue creation",
			"OCR import from paper catalogues",
			"Mobile-friendly design",
			"QR code sharing",
			"Real-time analytics",
			"Professional templates",
			"Instant updates",
			"No code required",
		],
	},
};

/** A plan's monthly offer, priced from what the server fetched; free plans are $0. */
function tierOffer(
	tier: (typeof standardTiers)[number],
	prices: Record<string, string>,
) {
	const formatted = prices[tier.priceId.month];
	const amount = formatted ? parsePrice(formatted)?.amount : undefined;
	return {
		"@type": "Offer",
		name: `${tier.name} plan`,
		price: String(amount ?? 0),
		priceCurrency: "USD",
		url: "https://www.quicktalog.app/pricing",
		priceSpecification: {
			"@type": "UnitPriceSpecification",
			price: String(amount ?? 0),
			priceCurrency: "USD",
			billingDuration: 1,
			billingIncrement: 1,
			unitCode: "MON",
		},
		description: tier.description,
	};
}

/** Questions and answers as structured data; the same ones the page renders. */
const faqSchema = (items: { question: string; answer: string }[]) => ({
	"@type": "FAQPage",
	mainEntity: items.map((item) => ({
		"@type": "Question",
		name: item.question,
		acceptedAnswer: { "@type": "Answer", text: item.answer },
	})),
});

/**
 * The pricing page. The offers are built from the real tiers and the prices the
 * server fetched, so a rich result shows what the page shows; they used to be two
 * hardcoded entries ($0 and $10) that matched no plan on sale.
 */
const pricingPageSchema = (prices: Record<string, string> = {}) => ({
	"@context": "https://schema.org",
	"@graph": [
		{
			"@type": "WebPage",
			name: "Pricing - Simple, Transparent Pricing | Quicktalog",
			description:
				"Start with our free online catalogue maker and upgrade as you grow. No hidden fees. Access professional catalogue templates, AI generation, OCR import, and analytics.",
			url: "https://www.quicktalog.app/pricing",
			mainEntity: {
				"@type": "Product",
				name: "Quicktalog",
				description:
					"Digital catalogue creation and management, from a free plan upwards.",
				offers: standardTiers.map((tier) => tierOffer(tier, prices)),
			},
		},
		faqSchema(pricingFaqs),
	],
});

const contactPageSchema = {
	"@context": "https://schema.org",
	"@type": "ContactPage",
	name: "Contact Us - Get Help with Your Digital Catalogue | Quicktalog",
	description:
		"Need help creating your digital catalogue? Contact our support team for assistance with setup, customization, and getting the most out of Quicktalog.",
	url: "https://www.quicktalog.app/contact",
	mainEntity: {
		"@type": "Organization",
		name: "Quicktalog",
		contactPoint: {
			"@type": "ContactPoint",
			email: "quicktalog@outlook.com",
			contactType: "customer service",
			availableLanguage: "English",
		},
	},
};

const demoPageSchema = {
	"@context": "https://schema.org",
	"@type": "WebPage",
	name: "Try the Demo - Test Our Catalogue Maker | Quicktalog",
	description:
		"Try our free online catalogue maker in the demo. Create a sample catalogue and see how easy it is to build professional digital catalogues.",
	url: "https://www.quicktalog.app/demo",
	mainEntity: {
		"@type": "SoftwareApplication",
		name: "Quicktalog Demo",
		applicationCategory: "BusinessApplication",
		operatingSystem: "Web Browser",
		description: "Interactive demo of Quicktalog's digital catalogue maker",
		offers: {
			"@type": "Offer",
			price: "0",
			priceCurrency: "USD",
			description: "Free to try",
		},
	},
};

const showcasesPageSchema = {
	"@context": "https://schema.org",
	"@type": "CollectionPage",
	name: "Showcases - See Digital Catalogues in Action | Quicktalog",
	description:
		"Explore real examples of digital catalogues created with Quicktalog. See how businesses use our platform to showcase their products and services.",
	url: "https://www.quicktalog.app/showcases",
	mainEntity: {
		"@type": "ItemList",
		name: "Digital Catalogue Examples",
		description: "Real examples of digital catalogues created with Quicktalog",
	},
};
const helpPageSchema = {
	"@context": "https://schema.org",
	"@type": "FAQPage",
	name: "Help Center - FAQs, Guides & Support | Quicktalog",
	description:
		"Visit the Quicktalog Help Center to find FAQs, step-by-step guides, and support resources to make the most out of your digital catalogue.",
	url: "https://www.quicktalog.app/help",
	mainEntity: faqs.map((faq) => ({
		"@type": "Question",
		name: faq.question,
		acceptedAnswer: {
			"@type": "Answer",
			text: faq.answer,
		},
	})),
};

const docsPageSchema = {
	"@context": "https://schema.org",
	"@type": "CollectionPage",
	name: "Docs - How to Build a Digital Catalogue | Quicktalog",
	description:
		"A step-by-step guide to creating, customizing, and sharing your digital catalogue with Quicktalog.",
	url: "https://www.quicktalog.app/docs",
	mainEntity: {
		"@type": "ItemList",
		name: "Quicktalog docs topics",
		description:
			"Pages that take you from a new account to a live catalogue you can share.",
	},
};

const authenticationPageSchema = {
	"@context": "https://schema.org",
	"@type": "WebPage",
	name: "Login & Sign Up - Access Your Quicktalog Account",
	description:
		"Log in or create a Quicktalog account to start building and managing your digital catalogues. Secure authentication with modern encryption.",
	url: "https://www.quicktalog.app/auth",
	potentialAction: [
		{
			"@type": "LoginAction",
			target: "https://www.quicktalog.app/auth",
		},
		{
			"@type": "RegisterAction",
			target: "https://www.quicktalog.app/auth??mode=signup",
		},
	],
};

const articlesPageSchema = {
	"@context": "https://schema.org",
	"@type": "CollectionPage",
	name: "Quicktalog Blog - Guides for Digital Menus & Catalogues",
	description:
		"Practical guides on digital menus, product catalogues, QR codes, and growing your business with Quicktalog.",
	url: "https://www.quicktalog.app/articles",
	mainEntity: {
		"@type": "ItemList",
		name: "Quicktalog articles",
		description:
			"Guides and use cases for digital menus and catalogues created with Quicktalog.",
	},
};

export function generateManualSchema(meta: ManualPageMeta, path: string) {
	const url = `https://www.quicktalog.app${path}`;
	return {
		"@context": "https://schema.org",
		"@graph": [
			{
				"@type": "TechArticle",
				headline: meta.title,
				description: meta.inShort,
				author: { "@type": "Organization", name: "Quicktalog" },
				publisher: {
					"@type": "Organization",
					name: "Quicktalog",
					logo: {
						"@type": "ImageObject",
						url: "https://www.quicktalog.app/images/brand/logo.svg",
					},
				},
				mainEntityOfPage: { "@type": "WebPage", "@id": url },
				...(meta.keywords?.length
					? { keywords: meta.keywords.join(", ") }
					: {}),
			},
			{
				"@type": "BreadcrumbList",
				itemListElement: [
					{
						"@type": "ListItem",
						position: 1,
						name: "Home",
						item: "https://www.quicktalog.app",
					},
					{
						"@type": "ListItem",
						position: 2,
						name: "Docs",
						item: "https://www.quicktalog.app/docs",
					},
					{
						"@type": "ListItem",
						position: 3,
						name: meta.title,
						item: url,
					},
				],
			},
		],
	};
}

export function generateArticleSchema(meta: ArticleMeta) {
	const url = `https://www.quicktalog.app/articles/${meta.slug}`;
	const image = meta.heroImage.startsWith("http")
		? meta.heroImage
		: `https://www.quicktalog.app${meta.heroImage}`;
	return {
		"@context": "https://schema.org",
		"@graph": [
			{
				"@type": "BlogPosting",
				headline: meta.title,
				description: meta.description,
				image,
				datePublished: meta.publishedAt,
				dateModified: meta.updatedAt ?? meta.publishedAt,
				author: { "@type": "Organization", name: meta.author },
				publisher: {
					"@type": "Organization",
					name: "Quicktalog",
					logo: {
						"@type": "ImageObject",
						url: "https://www.quicktalog.app/images/brand/logo.svg",
					},
				},
				mainEntityOfPage: { "@type": "WebPage", "@id": url },
				keywords: meta.keywords.join(", "),
			},
			{
				"@type": "BreadcrumbList",
				itemListElement: [
					{
						"@type": "ListItem",
						position: 1,
						name: "Home",
						item: "https://www.quicktalog.app",
					},
					{
						"@type": "ListItem",
						position: 2,
						name: "Articles",
						item: "https://www.quicktalog.app/articles",
					},
					{
						"@type": "ListItem",
						position: 3,
						name: meta.title,
						item: url,
					},
				],
			},
		],
	};
}

const releaseNotesPageSchema = {
	"@context": "https://schema.org",
	"@type": "CollectionPage",
	name: "Release Notes - What's New in Quicktalog",
	description:
		"See what's new, improved, and fixed in Quicktalog. Track every update to the digital catalogue builder, AI tools, and analytics.",
	url: "https://www.quicktalog.app/release-notes",
	mainEntity: {
		"@type": "ItemList",
		name: "Quicktalog release notes",
		description: "Every ship to the Quicktalog platform, newest first.",
	},
};

/**
 * Structured data for a page. `prices` are the server-rendered plan prices; pages
 * that do not show prices ignore them.
 */
export function getPageSchema(
	page: string,
	prices: Record<string, string> = {},
) {
	const schemas = {
		home: {
			"@context": "https://schema.org",
			"@graph": [
				homePageSchema,
				faqSchema(faqs),
				{
					"@type": "Product",
					name: "Quicktalog",
					description:
						"Digital catalogue creation and management, from a free plan upwards.",
					offers: standardTiers.map((tier) => tierOffer(tier, prices)),
				},
			],
		},
		pricing: pricingPageSchema(prices),
		contact: contactPageSchema,
		demo: demoPageSchema,
		showcases: showcasesPageSchema,
		privacy: organizationSchema,
		terms: organizationSchema,
		refund: organizationSchema,
		help: helpPageSchema,
		docs: docsPageSchema,
		auth: authenticationPageSchema,
		articles: articlesPageSchema,
		releaseNotes: releaseNotesPageSchema,
	};

	return schemas[page as keyof typeof schemas] || websiteSchema;
}

export const CONTACT_LIMITS = {
	name: 100,
	email: 254,
	subject: 150,
	message: 5000,
} as const;

/**
 * The contact / support message. `sendContactEmail` parses with this same
 * schema on the server (authoritative); the form uses it for field errors.
 */
export const contactSchema = z.object({
	name: z
		.string()
		.trim()
		.min(1, "Please enter your name.")
		.max(
			CONTACT_LIMITS.name,
			`Please keep your name under ${CONTACT_LIMITS.name} characters.`,
		),
	email: z
		.string()
		.trim()
		.toLowerCase()
		.min(1, "Please enter your email address.")
		.email("Enter a valid email address, for example name@company.com.")
		.max(CONTACT_LIMITS.email, "This email address is too long."),
	subject: z
		.string()
		.trim()
		.min(1, "Please choose a subject.")
		.max(CONTACT_LIMITS.subject, "This subject is too long."),
	message: z
		.string()
		.trim()
		.min(1, "Please tell us how we can help.")
		.max(
			CONTACT_LIMITS.message,
			`Please keep your message under ${CONTACT_LIMITS.message} characters.`,
		),
});

export type ContactValues = z.input<typeof contactSchema>;
export type ContactField = keyof ContactValues;

/** The first error message per field, or an empty object when the values are valid. */
export function getContactErrors(
	values: ContactValues,
): Partial<Record<ContactField, string>> {
	const result = contactSchema.safeParse(values);
	if (result.success) return {};
	const errors: Partial<Record<ContactField, string>> = {};
	for (const issue of result.error.issues) {
		const field = issue.path[0] as ContactField;
		errors[field] ??= issue.message;
	}
	return errors;
}

/* ------------------------------------------------------------------------ */
/* QR code designs (`qr_configs.config`)                                      */
/* ------------------------------------------------------------------------ */

const DOT_TYPES = [
	"square",
	"dots",
	"rounded",
	"extra-rounded",
	"classy",
	"classy-rounded",
] as const;

const hexColor = z.string().regex(HEX_COLOR, "Use a 6-digit hex colour");

/**
 * What the QR editor may store. Only qr-code-styling's known option groups and
 * the two app fields survive: unknown keys are stripped at every level
 * (`z.object` strips by default), gradients and node-only options are not
 * accepted, colours are `#RRGGBB`, sizes are bounded, and the logo must be ""
 * or an UploadThing URL (never a data: URL). `data` is accepted but the
 * server always replaces it with the catalogue's own URL.
 */
export const qrConfigSchema = z.object({
	type: z.enum(["svg", "canvas"]).optional(),
	shape: z.enum(["square", "circle"]).optional(),
	width: z.number().int().min(100).max(2000).optional(),
	height: z.number().int().min(100).max(2000).optional(),
	margin: z.number().int().min(0).max(100).optional(),
	data: z.string().max(2048).optional(),
	image: z
		.string()
		.max(LOGO_URL_MAX)
		.refine((value) => value === "" || isUploadedLogoUrl(value), {
			message: "Upload the logo with the editor",
		})
		.optional(),
	qrOptions: z
		.object({
			typeNumber: z.number().int().min(0).max(40).optional(),
			mode: z.enum(["Numeric", "Alphanumeric", "Byte", "Kanji"]).optional(),
			errorCorrectionLevel: z.enum(["L", "M", "Q", "H"]).optional(),
		})
		.optional(),
	imageOptions: z
		.object({
			hideBackgroundDots: z.boolean().optional(),
			imageSize: z.number().min(0.1).max(1).optional(),
			margin: z.number().int().min(0).max(50).optional(),
			crossOrigin: z.literal("anonymous").optional(),
		})
		.optional(),
	dotsOptions: z
		.object({
			type: z.enum(DOT_TYPES).optional(),
			color: hexColor.optional(),
			roundSize: z.boolean().optional(),
		})
		.optional(),
	cornersSquareOptions: z
		.object({
			type: z.enum(["dot", ...DOT_TYPES]).optional(),
			color: hexColor.optional(),
		})
		.optional(),
	cornersDotOptions: z
		.object({
			type: z.enum(["dot", ...DOT_TYPES]).optional(),
			color: hexColor.optional(),
		})
		.optional(),
	backgroundOptions: z
		.object({
			color: hexColor.optional(),
			round: z.number().min(0).max(1).optional(),
		})
		.optional(),
	frameText: z
		.object({
			show: z.boolean(),
			text: z.string().max(FRAME_TEXT_MAX),
		})
		.optional(),
	showLogo: z.boolean().optional(),
});

export type QrConfigInput = z.infer<typeof qrConfigSchema>;

/**
 * Byte budget for one stored design (UTF-8 JSON). Far above anything the
 * editor produces, and under the `qr_configs_config_size` constraint (64 KB).
 */
export const QR_CONFIG_MAX_BYTES = 16 * 1024;
