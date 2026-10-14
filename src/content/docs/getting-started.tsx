import { FiFlag } from "react-icons/fi";
import { ArticleImage } from "@/components/resources/ArticleImage";
import { Callout } from "@/components/resources/Callout";
import { KeyTakeaways } from "@/components/resources/KeyTakeaways";
import { Prose } from "@/components/resources/Prose";
import { Stepper } from "@/components/resources/Stepper";
import type { DocEntry } from "./_types";

const meta = {
	slug: "getting-started",
	title: "Getting Started with Quicktalog",
	description:
		"What Quicktalog is, who it is for, and how to go from a new account to your first live catalogue. Start here if you have not built one yet.",
	tag: "Start here",
	icon: FiFlag,
	order: 1,
	readingTimeMinutes: 3,
	keywords: [
		"Quicktalog getting started",
		"digital catalogue maker",
		"how to use Quicktalog",
		"create digital catalogue",
	],
	relatedSlugs: ["create-a-catalogue", "build-and-edit"],
} satisfies DocEntry["meta"];

function Body() {
	return (
		<>
			<ArticleImage
				alt="Overview of the Quicktalog platform showing a digital catalogue on multiple devices"
				maxWidth="640px"
				priority
				src="/images/documentation/getting-started-cover.svg"
			/>

			<Prose>
				<p>
					Quicktalog turns your products, services, or menu into a digital
					catalogue that lives on a single link. You build it once, share it
					with a link or a QR code, and update it whenever a price or an offer
					changes. There is no app for your customers to install and no designer
					or code on your side.
				</p>
				<p>
					These docs are written for the person running the business, not a
					developer. They walk through the whole flow in order, from signing up
					to sharing a finished catalogue and reading the results. If you are
					brand new, read this page first, then follow the topics in sequence.
				</p>
			</Prose>

			<KeyTakeaways
				points={[
					"A catalogue is one shareable page for your products, services, or menu.",
					"You can start from a ready template, from a blank page, or from a draft written by Quick AI.",
					"The free Starter plan is enough to build and share your first catalogue.",
					"You edit in the builder and nothing reaches customers until you publish.",
				]}
			/>

			<Prose>
				<h2>Create your account</h2>
				<p>
					Sign up with an email address to reach your dashboard. The free
					Starter plan lets you build and publish one catalogue with no time
					limit, so you do not need to enter a card to try the whole thing end
					to end.
				</p>
			</Prose>

			<ArticleImage
				alt="Quicktalog account setup screen showing the sign-up form and plan selection"
				maxWidth="640px"
				src="/images/documentation/getting-started-account-setup.svg"
			/>

			<Prose>
				<h2>Get to know the dashboard</h2>
				<p>
					The dashboard is your home base. It lists the catalogues you have
					created and gives you a button to start a new one. Each catalogue card
					is the way into its builder, its analytics, its QR code and its
					sharing options, and shows whether it is live or still a draft.
				</p>
				<p>
					The tabs down the side cover everything that is not a catalogue: your
					subscription, how much of your plan you have used this month, your
					account settings, and a form for reaching us.
				</p>
			</Prose>

			<ArticleImage
				alt="Quicktalog dashboard showing a list of catalogues with their status and quick actions"
				src="/images/documentation/getting-started-dashboard.svg"
			/>

			<Stepper
				steps={[
					{
						title: "Sign up",
						description:
							"Create your account with an email address. You land on the dashboard right away, on the free plan.",
					},
					{
						title: "Open the dashboard",
						description:
							"This is where every catalogue lives. From here you create new ones and open the ones you are working on.",
					},
					{
						title: "Start your first catalogue",
						description:
							"Name it, then pick what it starts as: a ready template or a blank page. The next topic walks through it.",
					},
				]}
			/>

			<Callout title="You do not need everything at once" variant="tip">
				You can publish a simple catalogue today and add photos, categories, and
				custom styling later. Nothing about the first version is permanent, so
				it is better to ship something small than to wait for perfect.
			</Callout>

			<Prose>
				<h2>How the pieces fit together</h2>
				<p>
					The rest of the docs follow the natural order of building a catalogue.
					You create a draft, shape it in the builder, hand the heavy lifting to
					Quick AI where it helps, make it look like your brand, publish and
					share it, then watch how it performs and adjust. Each step has its own
					short topic, so you can read straight through or jump to the part you
					are on.
				</p>
			</Prose>

			<ArticleImage
				alt="Quicktalog workflow diagram: create a draft, build it in the builder, share with a link or QR code, then track performance"
				src="/images/documentation/getting-started-workflow.svg"
			/>
		</>
	);
}

const doc: DocEntry = { meta, Body };
export default doc;
