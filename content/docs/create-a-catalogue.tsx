import { FiPlusCircle } from "react-icons/fi";
import ArticleCTA from "@/components/articles/ArticleCTA";
import Callout from "@/components/articles/Callout";
import KeyTakeaways from "@/components/articles/KeyTakeaways";
import Prose from "@/components/articles/Prose";
import Stepper from "@/components/articles/Stepper";
import type { DocEntry } from "./_types";

const meta = {
	slug: "create-a-catalogue",
	title: "Create Your First Catalogue",
	description:
		"Three ways to start a catalogue in Quicktalog: from a blank page, from an AI draft, or by importing a photo of a printed menu. Pick the fastest route for you.",
	tag: "Create",
	icon: FiPlusCircle,
	order: 2,
	readingTimeMinutes: 5,
	keywords: [
		"create catalogue",
		"AI catalogue generator",
		"OCR menu import",
		"build digital menu",
		"start a catalogue",
	],
	relatedSlugs: ["build-and-edit", "customize-design"],
} satisfies DocEntry["meta"];

function Body() {
	return (
		<>
			<Prose>
				<p>
					The hardest part of any catalogue is the empty screen at the start.
					Quicktalog gives you three ways past it. You can start from a blank
					page, describe your business and let AI draft it, or upload a photo of
					a catalogue you already have and let the import read it. All three
					land you in the same builder, so you can mix and match.
				</p>
			</Prose>

			<KeyTakeaways
				points={[
					"From scratch gives you the most control and suits short lists.",
					"AI generation drafts a full catalogue from a sentence or two about your business.",
					"Photo import reads a printed menu or PDF and turns it into a draft.",
					"Every route produces a draft you finish in the builder.",
				]}
			/>

			<Prose>
				<h2>Option one: start from scratch</h2>
				<p>
					Begin with a blank catalogue and add each item yourself. This is the
					simplest route when you have a short list or you know exactly how you
					want it laid out. You name the catalogue, then add items and
					categories one by one in the builder.
				</p>

				<h2>Option two: generate with AI</h2>
				<p>
					Open the AI Catalogue Generator and tell it what your business is. A
					short, clear description works best, something like a neighbourhood
					Italian restaurant with antipasti, pasta, mains, and a few desserts.
					Choose a theme, decide whether you want matching images created for
					you, and generate. The catalogue builds in the background and is ready
					in about five minutes.
				</p>
			</Prose>

			<Stepper
				steps={[
					{
						title: "Describe your business",
						description:
							"Enter your business name and type, then write one or two plain sentences about what you offer and how you group it.",
					},
					{
						title: "Pick a theme and image option",
						description:
							"Choose a starting theme. Turn on Generate Images if you want AI to create matching photos for your items.",
					},
					{
						title: "Generate and wait a few minutes",
						description:
							"The job runs in the background. You can leave the page and watch its status from the dashboard while it finishes.",
					},
					{
						title: "Refine the draft",
						description:
							"Open the result in the builder. Fix names, set your real prices, and trim anything that does not fit.",
					},
				]}
			/>

			<Callout title="Always set your own prices" variant="warning">
				AI guesses at prices and will get them wrong. Treat every figure in an
				AI draft as a placeholder and replace it with your real price before you
				publish. This is the one step you cannot skip.
			</Callout>

			<Prose>
				<h2>Option three: import from a photo</h2>
				<p>
					If your catalogue already exists on paper, photo import is the fastest
					route. Open Scan and Import, upload a photo or PDF, and choose the
					language of the text from more than thirty options. Quicktalog reads
					the page and sorts it into items with names and prices, which you then
					check and clean up.
				</p>
				<p>
					The import is only as good as the source. A flat, well lit photo of a
					clean menu reads almost perfectly. A creased page shot at an angle in
					dim light is harder to read, so the cleaner your image, the less you
					fix afterward.
				</p>
			</Prose>

			<Prose>
				<h2>Which route to pick</h2>
				<p>
					Choose AI when you are building something new and want a structure and
					starter descriptions to react to. Choose photo import when the
					catalogue already exists and you mainly want to avoid retyping it.
				</p>
				<h3>Reach for AI when</h3>
				<ul>
					<li>You are building a catalogue that does not exist yet.</li>
					<li>You want a ready structure and a set of starter descriptions.</li>
					<li>
						You only have the idea in your head, not a document to upload.
					</li>
				</ul>
				<h3>Reach for photo import when</h3>
				<ul>
					<li>The catalogue already exists on paper or as a PDF.</li>
					<li>You mainly want to avoid retyping every line by hand.</li>
					<li>You can get a clean, well lit image of the source.</li>
				</ul>
			</Prose>

			<ArticleCTA variant="mid" />

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
