import { KEYWORDS } from "@/constants"
import { Metadata } from "next"

// Site-wide metadata
export const siteMetadata = {
  title: "Quicktalog - Free Online Catalog Maker",
  description:
    "Create stunning digital catalogs in minutes with our free online catalog maker. Perfect for restaurants, salons, gyms, retail & more. No code required, mobile-friendly, QR code sharing.",
  keywords: KEYWORDS,
  authors: [{ name: "Quicktalog" }],
  creator: "Quicktalog",
  publisher: "Quicktalog",
  metadataBase: new URL("https://quicktalog.app"),
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://quicktalog.app",
    siteName: "Quicktalog",
    images: ["/opengraph-image.png"],
  },
  twitter: {
    card: "summary_large_image",
    site: "@quicktalog",
    creator: "@quicktalog",
    images: ["/twitter-image.png"],
  },
}

// Page-specific metadata
export const pageMetadata = {
  home: {
    title: "Quicktalog - Create Stunning Digital Catalogs in Minutes",
    description:
      "The best free online catalog maker for businesses. Turn your services, menus, or products into an interactive, mobile-friendly digital catalog. No code or design skills required.",
    url: "https://quicktalog.app",
  },
  pricing: {
    title: "Pricing - Simple, Transparent Pricing | Quicktalog",
    description:
      "Start with our free online catalog maker and upgrade as you grow. No hidden fees. Access professional catalog templates, AI generation, OCR import, and analytics.",
    url: "https://quicktalog.app/pricing",
  },
  contact: {
    title: "Contact Us - Get Help with Your Digital Catalog | Quicktalog",
    description:
      "Need help creating your digital catalog? Contact our support team for assistance with setup, customization, and getting the most out of Quicktalog.",
    url: "https://quicktalog.app/contact",
  },
  demo: {
    title: "Try the Demo - Test Our Catalog Maker | Quicktalog",
    description:
      "Try our free online catalog maker in the demo. Create a sample catalog and see how easy it is to build professional digital catalogs.",
    url: "https://quicktalog.app/demo",
  },
  showcases: {
    title: "Showcases - See Digital Catalogs in Action | Quicktalog",
    description:
      "Explore real examples of digital catalogs created with Quicktalog. See how businesses use our platform to showcase their products and services.",
    url: "https://quicktalog.app/showcases",
  },
  privacy: {
    title: "Privacy Policy - Your Data is Safe with Us | Quicktalog",
    description:
      "Learn how Quicktalog protects your privacy and data. We use industry-standard encryption and security measures to keep your information safe.",
    url: "https://quicktalog.app/privacy-policy",
  },
  terms: {
    title: "Terms and Conditions - Quicktalog Service Agreement",
    description:
      "Read our terms and conditions for using Quicktalog. Understand your rights and responsibilities when creating digital catalogs with our platform.",
    url: "https://quicktalog.app/terms-and-conditions",
  },
  refund: {
    title: "Refund Policy - Money Back Guarantee | Quicktalog",
    description:
      "Our refund policy ensures you're satisfied with Quicktalog. Learn about our money-back guarantee and how to request a refund.",
    url: "https://quicktalog.app/refund-policy",
  },
  help: {
    title: "Help Center - FAQs, Guides & Support | Quicktalog",
    description:
      "Visit the Quicktalog Help Center to find FAQs, step-by-step guides, and support resources to make the most out of your digital catalog.",
    url: "https://quicktalog.app/help",
  },
  authentication: {
    title: "Login & Sign Up - Access Your Quicktalog Account",
    description:
      "Log in or create a Quicktalog account to start building and managing your digital catalogs. Secure authentication with modern encryption.",
    url: "https://quicktalog.app/authentication",
  },
}

// Helper function to generate metadata for a page
export function generatePageMetadata(page: keyof typeof pageMetadata): Metadata {
  const pageData = pageMetadata[page]

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
  }
}

export function generateCatalogueMetadata(
  itemTitle: string,
  itemSubtitle: string,
  name: string
): Metadata {
  const title = `${itemTitle} - Digital Catalogue | Quicktalog`
  const description =
    itemSubtitle ||
    `Explore ${itemTitle}'s services and offerings in this interactive digital catalogue.`
  return {
    title,
    description,
    generator: "Quicktalog",
    applicationName: "Quicktalog",
    keywords: [...KEYWORDS, itemTitle],
    authors: [{ name: "Quicktalog" }],
    creator: "Quicktalog",
    publisher: "Quicktalog",
    metadataBase: new URL("https://quicktalog.app"),
    alternates: {
      canonical: `https://quicktalog.app/catalogues/${name}`,
    },
    openGraph: {
      title,
      description,
      url: `https://quicktalog.app/catalogues/${name}`,
      type: "website",
      images: ["/opengraph-image.png"],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ["/twitter-image.png"],
      creator: "Quicktalog",
      site: `https://quicktalog.app/catalogues/${name}`,
    },
  }
}
