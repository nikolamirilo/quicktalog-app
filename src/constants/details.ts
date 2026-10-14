import { themes } from "@quicktalog/common";

import { standardTiers, starterTier } from "@/constants/pricing";
import { CREDITS } from "@/lib/ai/pricing";
import { ISocials } from "@/types/shared";

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
	siteLogo: `${process.env.BASE_PATH || ""}/images/brand/logo.svg`,
	googleAnalyticsId: "",
};

export const footerDetails: {
	subheading: string;
	email: string;
	socials: ISocials;
} = {
	subheading:
		"Empowering businesses to go digital with interactive catalogues.",
	email: "quicktalog@outlook.com",
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

import { IFAQ } from "@/types/shared";

const starter = starterTier.features;
const topTier = standardTiers[standardTiers.length - 1];

/**
 * The Help Center questions. Also the homepage FAQ (first five) and the
 * FAQPage structured data, so the broad ones come first. Plan numbers are
 * interpolated from `tiers` so they cannot drift from the pricing page, and no
 * answer quotes a price: those come from Paddle at runtime.
 */
export const faqs: IFAQ[] = [
	{
		category: "basics",
		question:
			"What exactly is a digital catalogue and how is it different from a website?",
		answer:
			"A digital catalogue is one mobile-friendly page that shows what you offer, with prices, photos and descriptions, on a link you can share anywhere. A website explains your business; a catalogue sells what is in it. It is built to be updated in seconds, scanned from a QR code on a table or a window, and read on a phone without anyone installing anything.",
	},
	{
		category: "basics",
		question: "What kind of business is Quicktalog for?",
		answer:
			"Any business with a list of things it offers. Restaurants and cafes use it for menus, salons and studios for service lists, shops and wholesalers for product ranges, and agencies for packages and rates. If you can write it on a printed sheet, it works as a catalogue.",
	},
	{
		category: "start",
		question: "Do I need technical or design skills?",
		answer: `No. You edit your catalogue by tapping it, the same way you would edit a document, and all ${themes.length} themes are designed to look finished before you change anything. There is nothing to install, no code, and no designer to brief.`,
	},
	{
		category: "start",
		question: "How do I make my first catalogue?",
		answer:
			"Create an account, press Create catalogue, and give it a name, a language, a currency and a business type. You land in the builder, where you pick a ready template or a blank page and start filling it in. If you would rather not type it all, Quick AI can draft the whole thing from a sentence about your business, from photos of a printed menu, or from a page you already run.",
	},
	{
		category: "edit",
		question: "Can I update my catalogue when prices or services change?",
		answer:
			"Yes, as often as you like. Edits are saved to a private draft, so nothing your customers see changes until you press Publish. When you do, the same link and QR code show the new version immediately. No reprinting, no waiting on anyone.",
	},
	{
		category: "edit",
		question: "What is Quick AI and what can it do?",
		answer:
			"Quick AI is the assistant built into the builder. You ask for a change in plain language and it makes it: add a section with six items, make every description shorter, raise all prices by 10%, switch to a warmer theme. It works on the catalogue you have open, highlights everything it changed, and lets you keep it or undo it all in one tap. Nothing reaches your customers until you publish.",
	},
	{
		category: "edit",
		question: "I already have a printed menu. Do I have to retype it?",
		answer:
			"No. Photograph it, attach the photos to a message in Quick AI, and the text is read out of them and turned into items with names and prices. A flat, well lit photo of a clean page reads almost perfectly. Always check the prices afterwards, since photos of creased or angled pages can be misread.",
	},
	{
		category: "edit",
		question: "How do my customers open my catalogue?",
		answer:
			"Three ways, and all of them point at the same page: a link you can send or put in your social profiles, a QR code you can style and print on signs and table cards, and an embed snippet that puts the catalogue inside your own website. Customers need no app and no account, on any phone, tablet or computer.",
	},
	{
		category: "analytics",
		question: "Can I see how my catalogue is performing?",
		answer:
			"Yes. Every catalogue has its own analytics page on every plan, covering the last 7, 30 or 90 days. It shows total views, unique visitors, your busiest day and your average views per day, each compared with the period before, plus a chart of daily views and a day-by-day table. That is usually enough to see which posts, signs or promotions actually worked.",
	},
	{
		category: "analytics",
		question: "Can I connect my own Google Analytics or Meta Pixel?",
		answer:
			"On higher plans, yes. Paste your Google Analytics or Meta Pixel ID into the General tab in the builder and your catalogue reports into the tools you already use. Visitors are asked to allow analytics first and nothing loads if they decline, so remember to mention these tools in your privacy policy. Google Tag Manager is not supported, because a container can run any code on your page.",
	},
	{
		category: "billing",
		question: `What is included in the free ${starterTier.name} plan?`,
		answer: `The free plan gives you ${starter.catalogues} catalogue with up to ${starter.sections_per_catalogue} sections and ${starter.items_per_catalogue} items, ${starter.traffic_limit.toLocaleString("en-US")} page views a month, ${starter.ai_credits} AI credits a month, all ${themes.length} themes, the QR code editor, analytics and ${starter.support.toLowerCase()}. There is no time limit and no credit card required. Branding controls like your logo, contact details and a custom header and footer start on the first paid plan.`,
	},
	{
		category: "billing",
		question: "How do AI credits work?",
		answer: `Every plan includes a monthly allowance of credits for Quick AI, from ${starter.ai_credits} on the free plan up to ${topTier.features.ai_credits} on ${topTier.name}. Asking for a change costs ${CREDITS.agentBase} credits however many edits it takes, writing one item description costs ${CREDITS.describe}, and asking a question costs nothing. The allowance resets at the start of each month and unused credits do not carry over. You can see what is left in the chat panel and in the Usage tab of your dashboard.`,
	},
	{
		category: "billing",
		question: "What happens when I reach a limit?",
		answer:
			"It depends on the limit. Page views are the only one your customers notice: when your catalogues together use the month's allowance they go offline, and you can put them back online next month or straight away after upgrading. Running out of catalogues, sections or items simply stops you adding more, and everything already published stays as it is. Running out of AI credits pauses Quick AI, while the rest of the builder keeps working.",
	},
	{
		category: "billing",
		question: "Can I change or cancel my plan, and how are payments handled?",
		answer:
			"You can upgrade, downgrade or cancel at any time from the Subscription tab in your dashboard. Paddle is our merchant of record: they run the checkout, charge any sales tax or VAT that applies where you are, and send your receipts. Your first purchase is covered by a 10-day money-back guarantee, and renewals are generally not refundable, so cancel before your renewal date.",
	},
	{
		category: "support",
		question: "Is my data secure and private?",
		answer:
			"Yes. We use industry-standard encryption, your account data is reachable only by you, and a catalogue becomes public only when you publish it. Unpublished drafts and deactivated catalogues stay private. We do not sell personal information, and payment details are handled by Paddle and never stored by us. The privacy policy has the full detail.",
	},
	{
		category: "support",
		question: "What if I get stuck or need help?",
		answer: `The docs walk through the whole thing from a new account to a live catalogue, and this page answers the questions we hear most. If neither helps, the contact form and the Support tab in your dashboard both reach us, or write to ${footerDetails.email}. Every plan includes email support, and higher tiers add chat and scheduled calls.`,
	},
];

/** Subjects offered by the public contact form and the dashboard support form. */
export const contactSubjects = [
	"Custom Plan",
	"Pricing Questions",
	"Technical Support",
	"Feature Request",
	"Partnership",
	"General Inquiry",
	"Other",
];
