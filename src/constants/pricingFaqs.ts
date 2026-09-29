import { themes } from "@quicktalog/common";

import { footerDetails } from "@/constants/details";
import { paidTiers, standardTiers, starterTier } from "@/constants/pricing";
import type { IFAQ } from "@/types/shared";

const starter = starterTier.features;
const cheapestPaid = paidTiers[0];
const credits = standardTiers
	.map((tier) => `${tier.name} ${tier.features.ai_credits}`)
	.join(", ");
const pageViewAllowances = standardTiers
	.map(
		(tier) =>
			`${tier.name} ${tier.features.traffic_limit.toLocaleString("en-US")}`,
	)
	.join(", ");

/** Pricing FAQ. Plan numbers come from `tiers` so they never drift from the cards. */
export const pricingFaqs: IFAQ[] = [
	{
		question: `Is the ${starterTier.name} plan really free?`,
		answer: `Yes. ${starterTier.name} includes ${starter.catalogues} catalogue with up to ${starter.sections_per_catalogue} sections and ${starter.items_per_catalogue} items, ${starter.traffic_limit.toLocaleString("en-US")} page views a month, all ${themes.length} standard themes, the QR code editor and ${starter.support.toLowerCase()}, with no time limit. You don't need a credit card to sign up.`,
	},
	{
		question: "Which plans include the AI assistant?",
		answer: `Every plan comes with a monthly allowance of AI credits for the AI assistant in the builder and the item description writer: ${credits}. One AI-written item description costs 1 credit, and asking the assistant a question is free.`,
	},
	{
		question: "What counts as a page view?",
		answer:
			"Every time someone opens one of your catalogue pages. The allowance is shared across all your catalogues and resets each month. You can follow your usage from the Usage tab in your dashboard.",
	},
	{
		question: "What happens when I reach a limit?",
		answer: `It depends on the limit. Page views: once your catalogues together reach your plan's monthly allowance (${pageViewAllowances}), they are paused and go offline. You can publish them again from your dashboard once the allowance resets next month, or right away after upgrading. Catalogues, sections and items: when you try to add more than your plan allows, Quicktalog shows you what the next plan unlocks so you can decide whether to upgrade, and everything you have already published stays as it is.`,
	},
	{
		question: "Can I change or cancel my plan?",
		answer: `Yes. Paid plans start with ${cheapestPaid.name}. You can upgrade or cancel from the Subscription tab in your dashboard. Cancel before your renewal date, because renewals are generally not refundable.`,
	},
	{
		question: "How does the money-back guarantee work?",
		answer: `Your first purchase is covered by a 10-day money-back guarantee. Ask Paddle's buyer support at paddle.net, or email us at ${footerDetails.email} within 10 days of purchase. The refund policy has the details.`,
	},
	{
		question: "Who handles payments and taxes?",
		answer:
			"Paddle is our merchant of record. Paddle runs the secure checkout, charges any sales tax or VAT that applies in your country, and sends your receipts. Prices on this page are shown in US dollars, and Paddle may show local prices at checkout.",
	},
];
