import ArticleCTA from "@/components/articles/ArticleCTA";
import ArticleImage from "@/components/articles/ArticleImage";
import BarCompare from "@/components/articles/BarCompare";
import Callout from "@/components/articles/Callout";
import KeyTakeaways from "@/components/articles/KeyTakeaways";
import ProsCons from "@/components/articles/ProsCons";
import Prose from "@/components/articles/Prose";
import PullQuote from "@/components/articles/PullQuote";
import StatHighlights from "@/components/articles/StatHighlights";
import Stepper from "@/components/articles/Stepper";
import type { Article } from "./_types";

const meta = {
	slug: "create-catalog-with-ai",
	title: "Build a Product Catalog in Minutes with AI",
	description:
		"Two fast ways to skip the blank page: describe your business and let AI draft the catalog, or photograph an existing menu and import it with OCR.",
	category: "Guides",
	keywords: [
		"AI catalog generator",
		"AI menu maker",
		"create catalog with AI",
		"generate product catalog",
		"OCR menu import",
		"AI catalog builder",
	],
	heroImage:
		"https://images.unsplash.com/photo-1633114128174-2f8aa49759b0?auto=format&fit=crop&w=1600&q=80",
	heroImageAlt:
		"Two people building something together on a laptop, seen from above",
	heroCredit: { name: "Unsplash", url: "https://unsplash.com" },
	publishedAt: "2026-06-17",
	readingTimeMinutes: 6,
	author: "The Quicktalog Team",
	relatedSlugs: ["digital-menu-for-restaurants", "qr-code-catalog-guide"],
} satisfies Article["meta"];

function Body() {
	return (
		<>
			<Prose>
				<p>
					The hardest part of making a catalog is the empty screen at the start.
					You know what you sell, but turning it into a tidy list with
					categories, descriptions, and prices is the kind of job that gets
					pushed to next week, and the week after that. Most people do not stall
					because the work is hard. They stall because the first line is.
				</p>
				<p>
					There are two ways to skip the blank page. You can describe your
					business and let AI draft the catalog for you, or you can photograph a
					menu or price list you already have and let OCR import turn it into a
					draft. Both get you to something you can edit in a few minutes instead
					of an afternoon. This guide walks through each route, shows where each
					one wins, and is honest about the part you still need to do by hand.
				</p>
			</Prose>

			<KeyTakeaways
				points={[
					"Two fast starts: describe your business for an AI draft, or photograph an existing menu for an OCR import.",
					"Pick OCR when the catalog already exists on paper or as a PDF. Pick AI when you are building something new.",
					"Both routes produce a draft, not a finished catalog. Plan on a short human edit afterward.",
					"AI handles the boring middle. Prices, best sellers, and brand voice are still your job.",
				]}
			/>

			<StatHighlights
				stats={[
					{ value: "Minutes", label: "to a working draft, not an afternoon" },
					{ value: "~90%", label: "of the typing skipped on a typical menu" },
					{ value: "$0", label: "to start, no card needed" },
				]}
			/>

			<Prose>
				<h2>Option one: describe it and let AI draft it</h2>
				<p>
					Tell the AI generator what your business is and what you offer. A
					short, clear prompt works best. Something like "a neighbourhood
					Italian restaurant with antipasti, pasta, mains, and a small dessert
					list" gives it enough to work with. The more specific you are about
					categories and tone, the closer the first draft lands.
				</p>
				<p>
					It comes back with a structured draft: categories, sample items, and
					descriptions in a sensible order. The draft will not be perfect, and
					it is not meant to be. It is a starting point that already has the
					shape of a real catalog, so your job becomes correcting and trimming
					rather than building from zero.
				</p>
			</Prose>

			<Stepper
				steps={[
					{
						title: "Describe your business",
						description:
							"Write one or two plain sentences about what you sell and how you group it. Name the categories you already use and the rough number of items in each.",
					},
					{
						title: "Generate the draft",
						description:
							"AI returns a structured catalog: categories, sample items, and short descriptions in a sensible order. Treat it as a first version, not a final one.",
					},
					{
						title: "Trim and correct",
						description:
							"Delete anything you do not sell, fix names, and reorder so your strongest categories sit near the top. This is faster than typing from scratch.",
					},
					{
						title: "Set your real prices",
						description:
							"AI guesses at prices and will get them wrong. Replace every figure with your own. This is the one step you cannot skip.",
					},
				]}
			/>

			<ArticleImage
				alt="A vector illustration of AI assembling structured catalog content"
				caption="AI gives you a structured draft. You refine it in the builder."
				src="/images/ai.svg"
			/>

			<Prose>
				<h2>Option two: photograph what you already have</h2>
				<p>
					If you have a printed menu, a PDF, or even a clear photo, OCR import
					is the faster route. Upload the image and the text gets read and
					sorted into items with names and prices. You scan for the few things
					it misread, fix them, and move on. This is the route to choose when
					your catalog already exists on paper and you just want it online
					without retyping every line.
				</p>
				<p>
					OCR is only as good as the source. A flat, well lit photo of a clean
					menu reads almost perfectly. A creased page shot at an angle in dim
					light gives the reader trouble, so the cleaner your input, the less
					you fix afterward.
				</p>
			</Prose>

			<ProsCons
				cons={[
					"The menu already exists on paper, as a PDF, or in a photo.",
					"You mainly want to avoid retyping every line by hand.",
					"Your prices and item names are already final.",
					"You can get a clean, well lit image of the source.",
				]}
				consLabel="Reach for OCR when"
				pros={[
					"You are building a catalog that does not exist yet.",
					"You want a fresh structure and a starting set of descriptions.",
					"You only have ideas in your head, not a document to upload.",
					"You are happy to edit wording to match your voice.",
				]}
				prosLabel="Reach for AI when"
				title="AI route vs OCR route: which to pick"
			/>

			<Callout title="You can use both" variant="tip">
				These routes are not exclusive. Plenty of people import the old menu
				with OCR to capture the items fast, then ask AI to draft descriptions
				for the rows that came in bare. Start with whatever you already have,
				then let the other route fill the gaps.
			</Callout>

			<ArticleCTA variant="mid" />

			<Prose>
				<h2>How the two routes compare on effort</h2>
				<p>
					The point of both routes is the same: spend your time editing, not
					typing. Here is roughly how the start of a twenty item menu plays out,
					compared with building it line by line.
				</p>
			</Prose>

			<BarCompare
				caption="Rough figures for the draft stage only. Your own edit afterward takes the same care either way."
				items={[
					{ label: "Typing it by hand", value: 45, display: "~45 min" },
					{
						label: "OCR import from a clean photo",
						value: 5,
						display: "~5 min",
						highlight: true,
					},
					{
						label: "AI draft from a description",
						value: 4,
						display: "~4 min",
						highlight: true,
					},
				]}
				title="Time to a first editable draft (20-item menu)"
			/>

			<Prose>
				<h2>Editing in the builder</h2>
				<p>
					However you start, you finish in the builder. Reorder categories,
					rename items, set prices, and add photos to the things you most want
					to sell. This is where the catalog becomes yours rather than a generic
					draft, and it is worth a careful pass. Read it the way a customer
					would and cut anything that does not earn its place.
				</p>
				<p>
					If you run a restaurant or a service business, the same draft and edit
					flow applies to a{" "}
					<a href="/articles/digital-menu-for-restaurants">full digital menu</a>
					, so the work you do here carries straight over.
				</p>

				<h2>Publish and share</h2>
				<p>
					When it reads well, publish it. You get a link and a QR code, both
					ready to share on your site, your social profiles, or a sign in your
					space. Because the catalog lives online, you can come back and change
					anything later without starting over. If you plan to print the code on
					a table card or a poster, the{" "}
					<a href="/articles/qr-code-catalog-guide">QR code guide</a> covers how
					to make one that still scans.
				</p>
			</Prose>

			<PullQuote cite="The honest version of an AI workflow">
				Let the machine do the boring middle, then do the last ten percent by
				hand.
			</PullQuote>

			<Prose>
				<h2>Where AI helps, and where it does not</h2>
				<p>
					AI is good at the boring middle: laying out categories, drafting plain
					descriptions, and saving you from a blank page. It is not good at
					knowing your prices, your best sellers, or the small details that make
					your business yours. Treat the draft as a fast first version and do
					the last ten percent by hand.
				</p>
				<p>
					That mix, a quick AI or OCR start followed by a human edit, is how you
					get a real catalog in minutes without it feeling like a robot wrote
					it. The tool removes the friction. You still bring the judgment.
				</p>
			</Prose>

			<Callout title="Always check these by hand" variant="warning">
				Three things AI and OCR get wrong often enough to verify every time:
				prices, allergen or ingredient notes, and anything seasonal that may no
				longer be on offer. A wrong price or a missing allergen warning is the
				kind of mistake a customer notices first.
			</Callout>
		</>
	);
}

const article: Article = { meta, Body };
export default article;
