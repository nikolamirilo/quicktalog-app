import { themes } from "@quicktalog/common";
import { FiCreditCard } from "react-icons/fi";
import { ArticleImage } from "@/components/resources/ArticleImage";
import { Callout } from "@/components/resources/Callout";
import { KeyTakeaways } from "@/components/resources/KeyTakeaways";
import { Prose } from "@/components/resources/Prose";
import { Stepper } from "@/components/resources/Stepper";
import { starterTier } from "@/constants/pricing";
import type { DocEntry } from "./_types";

const starter = starterTier.features;

const meta = {
	slug: "plans-and-billing",
	title: "Plans and Billing",
	description:
		"Start free and upgrade only when you need more. What the free plan covers, what paid plans add, what happens when you reach a limit, and how to manage your subscription.",
	tag: "Account",
	icon: FiCreditCard,
	order: 9,
	readingTimeMinutes: 4,
	keywords: [
		"Quicktalog plans",
		"pricing",
		"upgrade plan",
		"manage subscription",
		"plan limits",
	],
	relatedSlugs: ["getting-started", "quick-ai"],
} satisfies DocEntry["meta"];

function Body() {
	return (
		<>
			<ArticleImage
				alt="Quicktalog plans overview showing Starter, Pro, and higher tiers with their key features"
				priority
				src="/images/documentation/plans-billing-cover.svg"
			/>

			<Prose>
				<p>
					Quicktalog is free to start and grows with you. The free plan is a
					real plan, not a trial, so you can build and share a catalogue without
					ever entering a card. You only upgrade when you bump into a limit that
					actually matters to you, like a second catalogue or more room for AI.
				</p>
			</Prose>

			<KeyTakeaways
				points={[
					`The free ${starterTier.name} plan includes one catalogue, all ${themes.length} themes and the QR editor, with no time limit.`,
					"Paid plans raise the limits on catalogues, sections, items, page views and AI credits.",
					"Higher tiers unlock custom branding, more section types, newsletter sign-ups and your own analytics tags.",
					"Billing runs through Paddle, and you manage it from the Subscription tab of your dashboard.",
				]}
			/>

			<Prose>
				<h2>What the free plan covers</h2>
				<p>
					{starterTier.name} lets you build one catalogue with up to{" "}
					{starter.sections_per_catalogue} sections and{" "}
					{starter.items_per_catalogue} items, share it with a link, an embed
					and a styled QR code, and read its analytics. It includes all{" "}
					{themes.length} themes, {starter.ai_credits} AI credits a month, and{" "}
					{starter.traffic_limit.toLocaleString("en-US")} page views a month.
					For a single menu or service list, it is often all you need. There is
					no time limit and no card required.
				</p>
				<p>
					What it does not include is the branding controls: your logo, contact
					details, legal information, and the custom header and footer come in
					on the first paid plan.
				</p>

				<h2>What upgrading adds</h2>
				<p>
					Paid plans lift the ceilings and turn on the bigger features. As you
					move up you get more catalogues, more sections and items in each one,
					higher page view and AI credit allowances, and then feature by
					feature: custom branding and dividers, then external content, custom
					visuals and advanced styling, then newsletter sign-ups and connecting
					your own Google Analytics or Meta Pixel.
				</p>
				<p>
					The pricing page lays out every plan side by side with the exact
					limits for each, so you can match a plan to how you actually work
					rather than guessing. The right plan is simply the lowest one that
					clears the limit you keep hitting.
				</p>
			</Prose>

			<ArticleImage
				alt="Side-by-side comparison of Quicktalog plans showing catalogues, items, view limits, and feature availability"
				maxWidth="640px"
				src="/images/documentation/plans-billing-comparison.svg"
			/>

			<Prose>
				<h2>Follow your usage</h2>
				<p>
					The Usage tab of your dashboard shows the three things that reset each
					month or move as you build: page views across all your catalogues, how
					many catalogues you have, and the AI credits you have spent. Checking
					it occasionally is how you see a limit coming rather than meeting it
					mid-edit.
				</p>

				<h2>What happens when you reach a limit</h2>
				<p>
					It depends on which one, and only the first has any effect on
					customers.
				</p>
				<ul>
					<li>
						<strong>Page views.</strong> When your catalogues together use the
						month&apos;s allowance, they go offline. You can put them back
						online once the allowance resets next month, or straight away after
						upgrading.
					</li>
					<li>
						<strong>Catalogues, sections and items.</strong> You are simply
						stopped from adding more, and shown what the next plan allows.
						Everything already published stays exactly as it is.
					</li>
					<li>
						<strong>AI credits.</strong> Quick AI stops until the month resets.
						Everything else in the builder keeps working, so you can carry on by
						hand.
					</li>
				</ul>
			</Prose>

			<ArticleImage
				alt="Quicktalog upgrade prompt showing when a plan limit is reached with options to move to the next tier"
				maxWidth="380px"
				src="/images/documentation/plans-billing-hit-limit.svg"
			/>

			<Stepper
				steps={[
					{
						title: "Compare plans",
						description:
							"Open the pricing page to see each tier and its limits next to each other.",
					},
					{
						title: "Upgrade when you hit a limit",
						description:
							"Pick the plan that clears the limit you keep running into, whether that is catalogues, page views, or AI credits.",
					},
					{
						title: "Manage it from your dashboard",
						description:
							"Change or cancel your plan from the Subscription tab at any time. Paddle handles payments, invoices, and tax.",
					},
				]}
			/>

			<Callout title="Pick the plan that fits the limit you hit" variant="note">
				There is no need to overbuy. Stay on the free plan until something
				specific stops you, then move up one step. It is easy to upgrade later,
				so start small and grow into a bigger plan only when the work calls for
				it.
			</Callout>

			<Prose>
				<h2>Payments, refunds and cancelling</h2>
				<p>
					Paddle is our merchant of record. They run the checkout, charge any
					sales tax or VAT that applies where you are, and send your receipts,
					so your card details never touch Quicktalog. Prices are shown in US
					dollars, and Paddle may show you a local price at checkout.
				</p>
				<p>
					Your first purchase is covered by a 10-day money-back guarantee. You
					can upgrade, downgrade or cancel at any time from the Subscription
					tab. Cancel before your renewal date, because renewals are generally
					not refundable, and if a downgrade leaves you over the new plan&apos;s
					limits, the extra catalogues are deactivated rather than deleted.
				</p>
			</Prose>

			<ArticleImage
				alt="The billing management screen in the Quicktalog dashboard showing current plan, renewal date, and upgrade or cancel options"
				maxWidth="640px"
				src="/images/documentation/plans-billing-manage.svg"
			/>
		</>
	);
}

const doc: DocEntry = { meta, Body };
export default doc;
