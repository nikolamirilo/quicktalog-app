import { FiCreditCard } from "react-icons/fi";
import ArticleImage from "@/components/articles/ArticleImage";
import Callout from "@/components/articles/Callout";
import KeyTakeaways from "@/components/articles/KeyTakeaways";
import Prose from "@/components/articles/Prose";
import Stepper from "@/components/articles/Stepper";
import type { DocEntry } from "./_types";

const meta = {
	slug: "plans-and-billing",
	title: "Plans and Billing",
	description:
		"Start free and upgrade only when you need more. What the free plan covers, what paid plans add, and how to manage your subscription.",
	tag: "Account",
	icon: FiCreditCard,
	order: 8,
	readingTimeMinutes: 3,
	keywords: [
		"Quicktalog plans",
		"pricing",
		"upgrade plan",
		"manage subscription",
		"billing",
	],
	relatedSlugs: ["getting-started", "create-a-catalogue"],
	coverImage: "/documentation/plans-billing-cover.svg",
} satisfies DocEntry["meta"];

function Body() {
	return (
		<>
			<ArticleImage
				src="/documentation/plans-billing-cover.svg"
				alt="Quicktalog plans overview showing Starter, Pro, and higher tiers with their key features"
				priority
			/>

			<Prose>
				<p>
					Quicktalog is free to start and grows with you. The free plan is a
					real plan, not a trial, so you can build and share a catalogue without
					ever entering a card. You only upgrade when you bump into a limit that
					actually matters to you, like a second catalogue or AI generation.
				</p>
			</Prose>

			<KeyTakeaways
				points={[
					"The free Starter plan includes one catalogue with the core features and no time limit.",
					"Paid plans raise the limits on catalogues, items, and views.",
					"Higher tiers unlock AI generation, photo import, advanced analytics, and custom code.",
					"Billing is handled securely by Paddle, and you manage it from your dashboard.",
				]}
			/>

			<Prose>
				<h2>What the free plan covers</h2>
				<p>
					The Starter plan lets you build one catalogue, share it with a link
					and a QR code, and read basic analytics. For a single menu or service
					list, it is often all you need. There is no time limit and no card
					required.
				</p>

				<h2>What upgrading adds</h2>
				<p>
					Paid plans lift the ceilings and turn on the bigger features. As you
					move up, you get more catalogues, more items per catalogue, and higher
					view limits, plus extras like AI generation, photo import, advanced
					analytics, embeds and custom code, and the option to remove Quicktalog
					branding. The right plan is simply the lowest one that clears the
					limit you keep hitting.
				</p>
				<p>
					The pricing page lays out every plan side by side with the exact
					limits for each, so you can match a plan to how you actually work
					rather than guessing.
				</p>
			</Prose>

			<ArticleImage
				src="/documentation/plans-billing-comparison.svg"
				alt="Side-by-side comparison of Quicktalog plans showing catalogues, items, view limits, and feature availability"
				maxWidth="640px"
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
							"Pick the plan that clears the limit you keep running into, whether that is more catalogues, AI, or photo import.",
					},
					{
						title: "Manage it from your dashboard",
						description:
							"Change or cancel your plan from the dashboard at any time. Paddle handles payments, invoices, and tax.",
					},
				]}
			/>

			<ArticleImage
				src="/documentation/plans-billing-hit-limit.svg"
				alt="Quicktalog upgrade prompt showing when a plan limit is reached with options to move to the next tier"
				maxWidth="380px"
			/>

			<Callout title="Pick the plan that fits the limit you hit" variant="note">
				There is no need to overbuy. Stay on the free plan until something
				specific stops you, then move up one step. It is easy to upgrade later,
				so start small and grow into a bigger plan only when the work calls for
				it.
			</Callout>

			<ArticleImage
				src="/documentation/plans-billing-manage.svg"
				alt="The billing management screen in the Quicktalog dashboard showing current plan, renewal date, and upgrade or cancel options"
				maxWidth="640px"
			/>
		</>
	);
}

const doc: DocEntry = { meta, Body };
export default doc;
