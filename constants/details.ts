import { ITestimonial } from "@/types/components";

export const siteDetails = {
	siteName: "Quicktalog",
	siteUrl: "https://www.quicktalog.app/",
	metadata: {
		title: "Quicktalog - Modern Digital Catalogue Solution",
		description:
			"Quicktalog empowers businesses to create, manage, and share interactive digital catalogues for products and services.",
	},
	language: "en-us",
	locale: "en-US",
	siteLogo: `${process.env.BASE_PATH || ""}/images/logo.svg`, // or use a string for the logo e.g. "TechStartup"
	googleAnalyticsId: "", // e.g. G-XXXXXXX,
};

import { ILinkItem, ISocials } from "@/types/components";

export const footerDetails: {
	subheading: string;
	quickLinks: ILinkItem[];
	legalLinks: ILinkItem[];
	email: string;
	telephone: string;
	socials: ISocials;
} = {
	subheading:
		"Empowering businesses to go digital with interactive catalogues.",
	quickLinks: [
		{
			text: "Pricing",
			url: "/pricing",
		},
		// {
		//   text: "Showcases",
		//   url: "/showcases",
		// },
		{
			text: "Help Center",
			url: "/help",
		},
		{
			text: "Contact Us",
			url: "/contact",
		},
	],
	legalLinks: [
		{
			text: "Terms & Conditions",
			url: "/terms-and-conditions",
		},
		{
			text: "Privacy Policy",
			url: "/privacy-policy",
		},
		{
			text: "Refund Policy",
			url: "/refund-policy",
		},
	],
	email: "quicktalog@outlook.com",
	telephone: "+1 (800) 123-4567",
	socials: {
		// github: 'https://github.com',
		// x: 'https://twitter.com/x',
		// twitter: "https://twitter.com/Twitter",
		// facebook: "https://facebook.com",
		// youtube: 'https://youtube.com',
		linkedin: "https://www.linkedin.com/company/quicktalog/",
		// threads: 'https://www.threads.net',
		// instagram: "https://www.instagram.com",
	},
};

import { IFAQ } from "@/types/components";

export const faqs: IFAQ[] = [
	{
		question:
			"What exactly is a digital catalog and how is it different from a website?",
		answer:
			"A digital catalog is a mobile-friendly, interactive showcase of your products or services that customers can browse, share, and access 24/7. Unlike a website, it's specifically designed for showcasing your offerings with easy updates, QR code sharing, and customer engagement features that drive sales.",
	},
	{
		question:
			"Do I need technical skills to create and manage my digital catalog?",
		answer:
			"Not at all! Our platform is designed for non-technical users. You can create your catalog using our simple interface, and if you have existing paper catalogs, our OCR technology can import them automatically. Most users create their first catalog in under 5 minutes.",
	},
	{
		question: "How much time does it take to set up my first digital catalog?",
		answer:
			"Most users can create their first catalog in under 5 minutes. If you have existing materials, our OCR import feature can digitize them instantly. The simple interface makes it as easy as using a word processor, and you can go live immediately.",
	},
	{
		question: "Can I update my catalog easily when prices or services change?",
		answer:
			"Absolutely! You can update your catalog anytime from your dashboard. Changes go live instantly, so your customers always see the most current information. No more waiting for designers or printing delays - update prices, add new services, and publish immediately.",
	},
	{
		question: "How do my customers access my digital catalog?",
		answer:
			"You can share your catalog via a unique link or QR code. Customers can view it on any device - smartphones, tablets, or computers. No app downloads required for your customers, making it incredibly easy for them to access your services.",
	},
	{
		question:
			"What if I already have a website? Do I still need a digital catalog?",
		answer:
			"Digital catalogs complement your website perfectly. While your website provides general information, a digital catalog is specifically designed for showcasing your products/services with easy sharing, QR codes, and customer engagement features that drive sales and improve customer experience.",
	},
	{
		question: "Can I see which items in my catalog are most popular?",
		answer:
			"Yes! Our analytics dashboard shows you views, popular items, customer engagement, and feedback. This helps you understand what your customers want and optimize your offerings to increase sales and improve customer satisfaction.",
	},
	{
		question: "Is my data secure and private?",
		answer:
			"Absolutely. We use industry-standard encryption and security measures to protect your data. Your catalog information is private and secure, and you have full control over what you share. Your business information is protected and accessible 24/7.",
	},
	{
		question: "What happens if I need help or have questions?",
		answer:
			"We offer comprehensive support including tutorials, guides, and direct support. All plans include email support, with priority support available on higher tiers. We're here to help you succeed with your digital catalog.",
	},
	{
		question:
			"Can I use this for my business catalog, service list, or product showcase?",
		answer:
			"Yes! Our platform is designed for any business that needs to showcase products or services. Whether you're a restaurant with a menu, a salon with services, a gym with classes, or any business with products to showcase - our platform works for you.",
	},
	{
		question: "What's included in the free plan?",
		answer:
			"Our free plan includes one digital catalog with basic customization, QR code sharing, and email support. You can create, customize, and share your catalog with no time limits. No credit card required to start.",
	},
	{
		question: "How much does it cost to upgrade?",
		answer:
			"We offer flexible pricing starting at $5/month for the Basic plan. Our Starter plan is free forever with one catalog. Higher tiers include more catalogs, AI features, OCR import, and advanced analytics to help you grow your business.",
	},
];

export const ctaDetails = {
	heading: "Ready to Transform Your Business?",
	subheading:
		"Join thousands of businesses already using digital catalogs to increase sales and improve customer experience. Start free today.",
	riskReversal: [
		"No credit card required",
		"Free plan forever",
		"Cancel anytime",
		"Setup in under 5 minutes",
	],
	appStoreUrl: "#",
	googlePlayUrl: "#",
};

export const testimonials: ITestimonial[] = [
	{
		name: "Maria Lopez",
		role: "Owner, Bella Café",
		message: `${siteDetails.siteName} transformed our menu updates from a weekly headache to a 2-minute task. Our customers love the QR code feature - no more waiting for printed menus!`,
		avatar: "/images/testimonial-1.webp",
		industry: "Hospitality",
		metric: "Saved 8 hours/week",
	},
	{
		name: "David Kim",
		role: "Manager, TechMart Electronics",
		message: `We digitalized our entire product catalog in under 5 minutes. The OCR feature saved us hours of manual entry. Our sales team loves how easy it is to share products with clients.`,
		avatar: "/images/testimonial-2.webp",
		industry: "Retail",
		metric: "40% faster product updates",
	},
	{
		name: "Sophie Dubois",
		role: "Marketing Lead, GreenLeaf Spa",
		message: `The ability to update our service list instantly and get real-time feedback from clients has helped us increase bookings by 40%. The analytics feature is a game-changer!`,
		avatar: "/images/testimonial-3.webp",
		industry: "Wellness",
		metric: "40% increase in bookings",
	},
];
