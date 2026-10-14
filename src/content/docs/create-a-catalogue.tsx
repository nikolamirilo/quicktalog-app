import { FiPlusCircle } from "react-icons/fi";
import { ArticleCTA } from "@/components/resources/ArticleCTA";
import { ArticleImage } from "@/components/resources/ArticleImage";
import { Callout } from "@/components/resources/Callout";
import { KeyTakeaways } from "@/components/resources/KeyTakeaways";
import { Prose } from "@/components/resources/Prose";
import { Stepper } from "@/components/resources/Stepper";
import type { DocEntry } from "./_types";

const meta = {
	slug: "create-a-catalogue",
	title: "Create Your First Catalogue",
	description:
		"Set up a new catalogue in Quicktalog: name it, pick a starting template, and fill it in yourself or let Quick AI draft it from a description, photos or your own web page.",
	tag: "Create",
	icon: FiPlusCircle,
	order: 2,
	readingTimeMinutes: 5,
	keywords: [
		"create catalogue",
		"catalogue templates",
		"AI catalogue generator",
		"build digital menu",
		"start a catalogue",
	],
	relatedSlugs: ["build-and-edit", "quick-ai"],
} satisfies DocEntry["meta"];

function Body() {
	return (
		<>
			<ArticleImage
				alt="Three ways to fill a new Quicktalog catalogue: a ready template, a blank page, or a draft written by Quick AI"
				maxWidth="640px"
				priority
				src="/images/documentation/create-catalogue-cover.svg"
			/>

			<Prose>
				<p>
					Creating a catalogue takes two short steps. You answer four questions
					about the business, and you choose what the page starts out as. From
					there you are in the builder, and everything else is editing.
				</p>
				<p>
					The hardest part is usually the empty screen, so Quicktalog does not
					give you one. You can begin from a ready-made template, from a blank
					page if you prefer the control, or by asking Quick AI to draft the
					whole thing from a sentence about your business.
				</p>
			</Prose>

			<KeyTakeaways
				points={[
					"You name the catalogue first, and that name becomes its web address.",
					"A new catalogue offers you two ready templates or a blank page.",
					"Quick AI can fill a catalogue from a description, from photos of a printed menu, or from a page you already run.",
					"Nothing is published until you say so, so a first attempt costs you nothing.",
				]}
			/>

			<Prose>
				<h2>Step one: the details</h2>
				<p>
					Press <strong>Create catalogue</strong> from the dashboard and fill in
					four things: a name, the language your items are written in, the
					currency your prices are in, and the kind of business you run.
				</p>
				<p>
					The name matters most, because it becomes the link you share. You see
					the finished address under the form as you type, and Quicktalog tells
					you straight away if that one is taken. Pick something short that a
					customer would recognise: your business name is almost always the
					right answer.
				</p>
			</Prose>

			<ArticleImage
				alt="The Create a Catalog dialog with fields for name, language, currency and business type, and a preview of the catalogue's web address"
				maxWidth="640px"
				src="/images/documentation/create-catalogue-details.svg"
			/>

			<Callout
				title="The language and currency are not just labels"
				variant="note"
			>
				They set how prices are shown and what language Quick AI writes in. You
				can change them later from the builder, but setting them correctly now
				saves you re-reading every description afterwards.
			</Callout>

			<Prose>
				<h2>Step two: pick a starting point</h2>
				<p>
					Confirming the details opens the builder, and an empty catalogue asks
					what you want it to start as. There are three answers, and none of
					them is permanent: a template is only a set of example sections you
					then edit or delete.
				</p>
				<ul>
					<li>
						<strong>Quick Start</strong> gives you two sections and six example
						items. It is the fastest way to see a finished-looking page you can
						overwrite line by line.
					</li>
					<li>
						<strong>Standard Catalog</strong> is larger, with four sections and
						fifteen items, and suits a longer menu or price list.
					</li>
					<li>
						<strong>Start from Scratch</strong> gives you a blank page. Best
						when you know exactly how you want it laid out, or when you are
						about to hand the work to Quick AI.
					</li>
				</ul>
			</Prose>

			<ArticleImage
				alt="The template picker offering Quick Start, Standard Catalog, and Start from Scratch"
				src="/images/documentation/create-catalogue-templates.svg"
			/>

			<Prose>
				<h2>Step three: fill it in</h2>
				<p>
					Now the catalogue is yours to write. You can do it by hand, adding one
					item at a time in the builder, which the next topic covers in full. Or
					you can ask Quick AI, the assistant built into the builder, to do the
					first pass for you.
				</p>
				<p>
					Open <strong>Ask AI</strong> and tell it what your business is. A
					short, clear description works best, something like a neighbourhood
					Italian restaurant with antipasti, pasta, mains and a few desserts.
					You watch the sections and items appear in the preview as it writes
					them, and anything you do not like you change or throw away.
				</p>
			</Prose>

			<Stepper
				steps={[
					{
						title: "Describe your business",
						description:
							"One or two plain sentences about what you offer and how you group it. Say how many items you want in each part.",
					},
					{
						title: "Or hand it what you already have",
						description:
							"Attach photos of a printed menu, or paste the address of your existing website, and Quick AI works from that instead.",
					},
					{
						title: "Watch it build",
						description:
							"Sections and items land in the preview as they are written, and the changes are outlined so you can see what moved.",
					},
					{
						title: "Keep it and refine",
						description:
							"Accept the changes, then fix names, set your real prices, and trim anything that does not fit.",
					},
				]}
			/>

			<ArticleImage
				alt="A short description handed to Quick AI and turned into a catalogue with sections, items and prices"
				maxWidth="640px"
				src="/images/documentation/create-catalogue-ai-flow.svg"
			/>

			<Callout title="Always set your own prices" variant="warning">
				AI guesses at prices and will get them wrong. Treat every figure in an
				AI draft as a placeholder and replace it with your real price before you
				publish. This is the one step you cannot skip.
			</Callout>

			<Prose>
				<h2>Which route to pick</h2>
				<p>
					Both routes end in the same place, so this is a question of where you
					want to spend your time rather than a decision you are stuck with.
				</p>
				<h3>Reach for Quick AI when</h3>
				<ul>
					<li>You are building a catalogue that does not exist yet.</li>
					<li>You want a ready structure and a set of starter descriptions.</li>
					<li>
						What you have is on paper or on a page somewhere, and you do not
						want to retype it.
					</li>
				</ul>
				<h3>Fill it in yourself when</h3>
				<ul>
					<li>The list is short enough to type in a few minutes.</li>
					<li>
						Every name, price and description is already decided and you only
						want them entered exactly.
					</li>
					<li>
						You would rather spend your AI credits later, on rewriting and
						restyling.
					</li>
				</ul>
			</Prose>

			<ArticleImage
				alt="Decision guide: Quick AI for a catalogue that does not exist yet, typing it in yourself for a short decided list"
				maxWidth="640px"
				src="/images/documentation/create-catalogue-decision.svg"
			/>

			<ArticleCTA />

			<Prose>
				<p>
					Whichever route you choose, the next step is the same. You open the
					builder and make the catalogue yours. That is where the next topic
					picks up.
				</p>
			</Prose>
		</>
	);
}

const doc: DocEntry = { meta, Body };
export default doc;
