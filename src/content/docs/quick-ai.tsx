import { FiZap } from "react-icons/fi";
import { ArticleCTA } from "@/components/resources/ArticleCTA";
import { ArticleImage } from "@/components/resources/ArticleImage";
import { Callout } from "@/components/resources/Callout";
import { KeyTakeaways } from "@/components/resources/KeyTakeaways";
import { Prose } from "@/components/resources/Prose";
import { Stepper } from "@/components/resources/Stepper";
import { starterTier } from "@/constants/pricing";
// The same numbers the builder estimates with and the server charges.
import { CREDITS } from "@/lib/ai/pricing";
import type { DocEntry } from "./_types";

const meta = {
	slug: "quick-ai",
	title: "Build with Quick AI",
	description:
		"Quick AI is the assistant inside the builder. Ask for a change in plain language, give it photos or a web page to work from, then keep or undo what it did.",
	tag: "Quick AI",
	icon: FiZap,
	order: 4,
	readingTimeMinutes: 6,
	keywords: [
		"Quick AI",
		"AI catalogue builder",
		"AI credits",
		"menu photo to catalogue",
		"AI catalogue assistant",
	],
	relatedSlugs: ["build-and-edit", "create-a-catalogue"],
} satisfies DocEntry["meta"];

function Body() {
	return (
		<>
			<ArticleImage
				alt="The Quick AI panel open over a catalogue in the builder, with the section it just edited outlined in amber"
				priority
				src="/images/documentation/quick-ai-cover.svg"
			/>

			<Prose>
				<p>
					Quick AI is the assistant built into the builder. You tell it what you
					want in ordinary language, and it makes the change for you: adds a
					section, rewrites every description, raises your prices, switches the
					theme. It works on the catalogue you have open, so you watch each edit
					land in the preview as it happens.
				</p>
				<p>
					It is not a separate generator you run once at the start. You can
					reach for it on the first day, when the catalogue is empty, and again
					six months later to change one price.
				</p>
			</Prose>

			<KeyTakeaways
				points={[
					"Quick AI edits the catalogue you have open, in the builder, while you watch.",
					"Give it words, photos of a printed menu, or the address of a page you already have.",
					"Nothing is permanent: you accept or reject its changes, and nothing reaches customers until you publish.",
					"Each plan includes a monthly allowance of AI credits. Asking a question is free.",
				]}
			/>

			<Prose>
				<h2>Open it in the builder</h2>
				<p>
					Open any catalogue in the builder and look for <strong>Ask AI</strong>
					: in the toolbar on the right on a computer, in the bar along the
					bottom on a phone. The panel opens beside your catalogue, and you type
					in it the way you would text someone.
				</p>
				<p>
					If you are not sure where to start, the panel suggests a few things to
					try. Tapping one sends it, so you can see how the whole thing behaves
					before writing anything yourself.
				</p>

				<h2>What it can change</h2>
				<p>
					Quick AI reaches the same settings you do, and it is held to the same
					plan limits. If something is not part of your plan, it tells you so
					rather than quietly doing something else.
				</p>
				<ul>
					<li>
						<strong>Sections and items.</strong> Add, rename, reorder and delete
						them, or fill a new section with items in one go.
					</li>
					<li>
						<strong>Words and prices.</strong> Rewrite descriptions in a
						different tone, shorten them all, or change prices across a whole
						section.
					</li>
					<li>
						<strong>Look and feel.</strong> Switch theme, adjust fonts and
						sizes, or mix a custom palette and save it to your theme library.
					</li>
					<li>
						<strong>Photos.</strong> Find and attach a stock photo for items
						that have none, when you ask for images.
					</li>
					<li>
						<strong>Header, footer and business details.</strong> Contact
						details, social links, the action button, and your legal
						information.
					</li>
				</ul>
			</Prose>

			<ArticleImage
				alt="Six things Quick AI can change: sections, item text, theme and colours, photos, external content, and custom visuals, the last two marked as plan-locked"
				src="/images/documentation/quick-ai-what-it-does.svg"
			/>

			<Prose>
				<h2>Three ways to give it what it needs</h2>
				<p>
					The quality of what comes back depends on what you give it. There are
					three ways to hand it the raw material, and you can combine them in a
					single message.
				</p>
				<h3>Describe it in words</h3>
				<p>
					The simplest route. Say what your business is and what you want:{" "}
					<em>
						add a starters section with six Italian antipasti and short
						descriptions
					</em>
					. Short, concrete, specific about the number of items and the tone.
				</p>
				<h3>Attach photos of what you already have</h3>
				<p>
					If your menu or price list exists on paper, photograph it and attach
					the photos to your message. Quicktalog reads the text out of them in
					your own browser, then Quick AI turns it into items with names and
					prices. A flat, well lit photo of a clean page reads almost perfectly;
					a creased page shot at an angle leaves you more to fix.
				</p>
			</Prose>

			<ArticleImage
				alt="A photographed menu read line by line into a list of catalogue items with names and prices"
				maxWidth="640px"
				src="/images/documentation/quick-ai-scan.svg"
			/>

			<Prose>
				<h3>Point it at a page you already have</h3>
				<p>
					On paid plans you can paste the address of a page you already run,
					like your website or an online menu, and ask Quick AI to work from it.
					It reads the words on that page and nothing else: it never copies
					code, scripts or embeds out of a page, and it only ever opens an
					address you typed yourself.
				</p>
			</Prose>

			<ArticleImage
				alt="Three inputs to Quick AI - a typed description, attached photos, and a web page address - producing one catalogue draft"
				maxWidth="640px"
				src="/images/documentation/quick-ai-sources.svg"
			/>

			<Callout title="Always check the prices" variant="warning">
				Quick AI guesses at a price when you have not given it one, and it will
				guess wrong. Treat every figure it writes as a placeholder and replace
				it with your real price before you publish. The same goes for opening
				hours, contact details and anything a customer might act on.
			</Callout>

			<Prose>
				<h2>Bigger requests become a checklist</h2>
				<p>
					Ask for several things at once, or for one thing large enough to take
					many edits, and Quick AI writes a short plan first. You see the list
					of what it is about to do and each line ticks off as it finishes, so a
					long build is something you can follow rather than a spinner you wait
					on.
				</p>
				<p>
					If one piece turns out to be impossible, because your plan does not
					include that section type or you never supplied a booking link, that
					line is marked as skipped with the reason, and the rest carries on.
				</p>
			</Prose>

			<Stepper
				steps={[
					{
						title: "Ask for what you want",
						description:
							"One message is enough, even for a few separate things. Say what you want rather than which buttons to press.",
					},
					{
						title: "Watch the list",
						description:
							"For anything larger, a short checklist appears first and ticks off as the work lands in your preview.",
					},
					{
						title: "Review the changes",
						description:
							"Edited sections and items are outlined and tagged, so you can see exactly what moved.",
					},
					{
						title: "Keep it or undo it",
						description:
							"Accept to keep everything, or reject to put the catalogue back the way it was before that request.",
					},
				]}
			/>

			<Prose>
				<h2>Keep it or undo it</h2>
				<p>
					Every change Quick AI makes arrives on the builder outlined and
					tagged, with a bar offering two choices: accept them all, or reject
					them all. Rejecting puts the catalogue back the way it was before that
					request, so there is no risk in asking for something and seeing how it
					looks.
				</p>
			</Prose>

			<ArticleImage
				alt="Two catalogue items outlined in amber and tagged as AI changes, with a review bar offering reject or accept"
				maxWidth="640px"
				src="/images/documentation/quick-ai-review.svg"
			/>

			<Callout title="Nothing is live until you publish" variant="note">
				Quick AI edits your draft, exactly like editing by hand. Your customers
				keep seeing the last published version until you press Publish, so you
				can let it rework a whole catalogue without anyone seeing it half done.
			</Callout>

			<Prose>
				<h2>What a request costs</h2>
				<p>
					AI work is measured in credits, and every plan includes a monthly
					allowance. The free plan comes with {starterTier.features.ai_credits}{" "}
					credits a month, and the paid plans go up from there. The allowance
					resets at the start of each month and unused credits do not carry
					over.
				</p>
				<ul>
					<li>
						<strong>
							Asking for a change costs {CREDITS.agentBase} credits,
						</strong>{" "}
						however many edits it takes to do.
					</li>
					<li>
						A request that becomes a checklist costs {CREDITS.perExtraTask} more
						for each item on the list after the first.
					</li>
					<li>
						Reading a web page adds {CREDITS.perPageFetch} credits each time.
					</li>
					<li>Writing one item description costs {CREDITS.describe} credit.</li>
					<li>
						<strong>Asking a question is free</strong>, and so is a request that
						ends up changing nothing.
					</li>
				</ul>
				<p>
					You never have to work this out in your head. The panel shows how many
					credits you have left, a checklist tells you what it is about to cost
					before it starts, and the Usage tab of your dashboard shows the month
					so far.
				</p>
				<p>
					One thing to know on the free plan: confirming your email address is
					what switches Quick AI on. If it will not start for you, check your
					inbox for the confirmation link before anything else.
				</p>
			</Prose>

			<ArticleImage
				alt="A credits meter beside the price of each kind of AI request: a change, an extra checklist item, a page read, and a free question"
				maxWidth="640px"
				src="/images/documentation/quick-ai-credits.svg"
			/>

			<Prose>
				<h2>Writing a request that works</h2>
				<p>
					Quick AI reads your catalogue before it answers, so you rarely need to
					explain what is already there. What helps is being specific about the
					outcome.
				</p>
				<ul>
					<li>
						<strong>Say how many.</strong> Six items is a better instruction
						than a few items.
					</li>
					<li>
						<strong>Name the section.</strong> Pointing at Desserts is clearer
						than the last one.
					</li>
					<li>
						<strong>Describe the tone you want</strong> rather than editing word
						by word: warmer, shorter, less formal.
					</li>
					<li>
						<strong>Ask for one change at a time when you are unsure.</strong>{" "}
						It is easier to judge, and cheaper to undo.
					</li>
					<li>
						<strong>Ask it questions.</strong> What would you change about this
						page costs nothing and often beats guessing.
					</li>
				</ul>

				<h2>One more place AI helps</h2>
				<p>
					You do not have to open the panel for small things. When you are
					editing an item, the description field has its own button that writes
					a description from the item name, or rewrites the one you have already
					typed. It costs a single credit and is the fastest way to get a blank
					field filled.
				</p>
			</Prose>

			<ArticleCTA />
		</>
	);
}

const doc: DocEntry = { meta, Body };
export default doc;
