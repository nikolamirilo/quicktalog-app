import type { ArticleMeta } from "@/content/articles/_types";
import type { DocMeta } from "@/content/docs/_types";
import { KEYWORDS } from "@/constants";
import { Metadata } from "next";

// Site-wide metadata
export const siteMetadata = {
	title: "Quicktalog - Free Online Catalogue Maker",
	description:
		"Create stunning digital catalogs in minutes with our free online catalog maker. Perfect for restaurants, salons, gyms, retail & more. No code required, mobile-friendly, QR code sharing.",
	keywords: KEYWORDS,
	authors: [{ name: "Quicktalog" }],
	creator: "Quicktalog",
	publisher: "Quicktalog",
	metadataBase: new URL("https://www.quicktalog.app"),
	openGraph: {
		type: "website",
		locale: "en_US",
		url: "https://www.quicktalog.app",
		siteName: "Quicktalog",
		images: ["/opengraph-image.png"],
	},
	twitter: {
		card: "summary_large_image",
		site: "@quicktalog",
		creator: "@quicktalog",
		images: ["/twitter-image.png"],
	},
};

// Page-specific metadata
export const pageMetadata = {
	home: {
		title: "Quicktalog - Create Stunning Digital Catalogs in Minutes",
		description:
			"The best free online catalog maker for businesses. Turn your services, menus, or products into an interactive, mobile-friendly digital catalog. No code or design skills required.",
		url: "https://www.quicktalog.app",
	},
	pricing: {
		title: "Pricing - Simple, Transparent Pricing | Quicktalog",
		description:
			"Start with our free online catalog maker and upgrade as you grow. No hidden fees. Access professional catalog templates, AI generation, OCR import, and analytics.",
		url: "https://www.quicktalog.app/pricing",
	},
	contact: {
		title: "Contact Us - Get Help with Your Digital Catalogue| Quicktalog",
		description:
			"Need help creating your digital catalog? Contact our support team for assistance with setup, customization, and getting the most out of Quicktalog.",
		url: "https://www.quicktalog.app/contact",
	},
	demo: {
		title: "Try the Demo - Test Our CatalogueMaker | Quicktalog",
		description:
			"Try our free online catalog maker in the demo. Create a sample catalog and see how easy it is to build professional digital catalogs.",
		url: "https://www.quicktalog.app/demo",
	},
	showcases: {
		title: "Showcases - See Digital Catalogs in Action | Quicktalog",
		description:
			"Explore real examples of digital catalogs created with Quicktalog. See how businesses use our platform to showcase their products and services.",
		url: "https://www.quicktalog.app/showcases",
	},
	privacy: {
		title: "Privacy Policy - Your Data is Safe with Us | Quicktalog",
		description:
			"Learn how Quicktalog protects your privacy and data. We use industry-standard encryption and security measures to keep your information safe.",
		url: "https://www.quicktalog.app/privacy-policy",
	},
	terms: {
		title: "Terms and Conditions - Quicktalog Service Agreement",
		description:
			"Read our terms and conditions for using Quicktalog. Understand your rights and responsibilities when creating digital catalogs with our platform.",
		url: "https://www.quicktalog.app/terms-and-conditions",
	},
	refund: {
		title: "Refund Policy - Money Back Guarantee | Quicktalog",
		description:
			"Our refund policy ensures you're satisfied with Quicktalog. Learn about our money-back guarantee and how to request a refund.",
		url: "https://www.quicktalog.app/refund-policy",
	},
	help: {
		title: "Help Center - FAQs, Guides & Support | Quicktalog",
		description:
			"Visit the Quicktalog Help Center to find FAQs, step-by-step guides, and support resources to make the most out of your digital catalog.",
		url: "https://www.quicktalog.app/help",
	},
	docs: {
		title: "Docs - How to Build a Digital Catalogue | Quicktalog",
		description:
			"A step-by-step guide to creating, customizing, and sharing your digital catalogue with Quicktalog. Learn the builder, AI generation, OCR import, QR sharing, and analytics.",
		url: "https://www.quicktalog.app/docs",
	},
	articles: {
		title: "Quicktalog Blog - Guides for Digital Menus & Catalogs",
		description:
			"Practical guides on digital menus, product catalogs, QR codes, and growing your business with Quicktalog.",
		url: "https://www.quicktalog.app/articles",
	},
	authentication: {
		title: "Login & Sign Up - Access Your Quicktalog Account",
		description:
			"Log in or create a Quicktalog account to start building and managing your digital catalogs. Secure authentication with modern encryption.",
		url: "https://www.quicktalog.app/authentication",
	},
};

// Helper function to generate metadata for a page
export function generatePageMetadata(
	page: keyof typeof pageMetadata,
): Metadata {
	const pageData = pageMetadata[page];
	return {
		title: pageData.title,
		description: pageData.description,
		generator: "Quicktalog",
		applicationName: "Quicktalog",
		keywords: siteMetadata.keywords,
		authors: siteMetadata.authors,
		creator: siteMetadata.creator,
		publisher: siteMetadata.publisher,
		metadataBase: siteMetadata.metadataBase,
		alternates: {
			canonical: pageData.url,
		},
		openGraph: {
			...siteMetadata.openGraph,
			title: pageData.title,
			description: pageData.description,
			url: pageData.url,
		},
		twitter: {
			...siteMetadata.twitter,
			title: pageData.title,
			description: pageData.description,
			creator: siteMetadata.creator,
			site: pageData.url,
		},
	};
}

export function generateDocMetadata(meta: DocMeta): Metadata {
	const url = `https://www.quicktalog.app/docs/${meta.slug}`;
	const title = `${meta.title} | Quicktalog Docs`;
	return {
		title,
		description: meta.description,
		generator: "Quicktalog",
		applicationName: "Quicktalog",
		keywords: [...siteMetadata.keywords, ...meta.keywords],
		authors: siteMetadata.authors,
		creator: siteMetadata.creator,
		publisher: siteMetadata.publisher,
		metadataBase: siteMetadata.metadataBase,
		alternates: {
			canonical: url,
		},
		openGraph: {
			...siteMetadata.openGraph,
			type: "article",
			url,
			title,
			description: meta.description,
		},
		twitter: {
			...siteMetadata.twitter,
			title,
			description: meta.description,
			creator: siteMetadata.creator,
			site: url,
		},
	};
}

export function generateCatalogueMetadata(
	itemTitle: string,
	itemSubtitle: string,
	name: string,
	icon: string,
	opengraphImage: string,
): Metadata {
	const title = `${itemTitle} | Quicktalog`;
	const description =
		itemSubtitle ||
		`Explore ${name}'s services and offerings in this interactive digital catalogue.`;
	return {
		title,
		description,
		generator: "Quicktalog",
		applicationName: "Quicktalog",
		icons: {
			icon: icon,
			apple: icon,
		},
		keywords: [...KEYWORDS, itemTitle],
		authors: [{ name: "Quicktalog" }],
		creator: "Quicktalog",
		publisher: "Quicktalog",
		metadataBase: new URL("https://www.quicktalog.app"),
		alternates: {
			canonical: `https://www.quicktalog.app/catalogues/${name}`,
		},
		openGraph: {
			title,
			description,
			url: `https://www.quicktalog.app/catalogues/${name}`,
			type: "website",
			images: [opengraphImage],
		},
		twitter: {
			card: "summary_large_image",
			title,
			description,
			images: [opengraphImage],
			creator: "Quicktalog",
			site: `https://www.quicktalog.app/catalogues/${name}`,
		},
	};
}

export function generateArticleMetadata(meta: ArticleMeta): Metadata {
	const url = `https://www.quicktalog.app/articles/${meta.slug}`;
	return {
		title: `${meta.title} | Quicktalog`,
		description: meta.description,
		generator: "Quicktalog",
		applicationName: "Quicktalog",
		keywords: [...siteMetadata.keywords, ...meta.keywords],
		authors: [{ name: meta.author }],
		creator: siteMetadata.creator,
		publisher: siteMetadata.publisher,
		metadataBase: siteMetadata.metadataBase,
		alternates: {
			canonical: url,
		},
		openGraph: {
			type: "article",
			locale: "en_US",
			url,
			siteName: "Quicktalog",
			title: meta.title,
			description: meta.description,
			images: [meta.heroImage],
			publishedTime: meta.publishedAt,
			modifiedTime: meta.updatedAt ?? meta.publishedAt,
			authors: [meta.author],
		},
		twitter: {
			card: "summary_large_image",
			site: "@quicktalog",
			creator: "@quicktalog",
			title: meta.title,
			description: meta.description,
			images: [meta.heroImage],
		},
	};
}
