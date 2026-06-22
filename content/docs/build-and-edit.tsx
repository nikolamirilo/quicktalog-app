import { FiEdit3 } from "react-icons/fi";
import ArticleImage from "@/components/articles/ArticleImage";
import Callout from "@/components/articles/Callout";
import KeyTakeaways from "@/components/articles/KeyTakeaways";
import Prose from "@/components/articles/Prose";
import Stepper from "@/components/articles/Stepper";
import type { DocEntry } from "./_types";

const meta = {
	slug: "build-and-edit",
	title: "Build and Edit Your Catalogue",
	description:
		"How the Quicktalog builder works: add and edit items, group them into categories, add content blocks, and find your way around the settings tabs.",
	tag: "Build",
	icon: FiEdit3,
	order: 3,
	readingTimeMinutes: 5,
	keywords: [
		"catalogue builder",
		"edit catalogue items",
		"catalogue categories",
		"content blocks",
		"add products",
	],
	relatedSlugs: ["customize-design", "share-your-catalogue"],
	coverImage: "/documentation/build-edit-cover.svg",
} satisfies DocEntry["meta"];

function Body() {
	return (
		<>
			<ArticleImage
				src="/documentation/build-edit-cover.svg"
				alt="The Quicktalog builder showing a live catalogue preview alongside the settings panel"
				priority
			/>

			<Prose>
				<p>
					The builder is where a draft becomes a real catalogue. It shows a live
					preview of your page with a settings panel beside it. Every change you
					make appears right away, so you always see exactly what a customer
					will see. Your work is saved to the draft as you go.
				</p>
			</Prose>

			<KeyTakeaways
				points={[
					"Items are the core of a catalogue: a name, a price, a photo, and a short description.",
					"Categories group items so a long list stays easy to scan.",
					"Content blocks add text and dividers between items, with embeds and custom code on higher plans.",
					"The settings panel is split into General, Header, Footer, and Appearance.",
				]}
			/>

			<Prose>
				<h2>Add and edit items</h2>
				<p>
					An item is a single thing you offer. Add one, then give it a name, a
					price, a photo, and a short description. Good photos and a clear line
					of description do most of the selling, so spend the time on the items
					that matter most. You can come back and edit any item later without
					republishing from scratch.
				</p>
			</Prose>

			<Stepper
				steps={[
					{
						title: "Add an item",
						description:
							"Create a new item in the category you want it to sit in. An empty item appears in the preview, ready to fill.",
					},
					{
						title: "Fill in the details",
						description:
							"Set the name, price, and a short description. Add a photo for anything you want to stand out.",
					},
					{
						title: "Arrange the order",
						description:
							"Put your strongest items near the top of their category. People scan from the top, so lead with what sells.",
					},
				]}
			/>

			<ArticleImage
				src="/documentation/build-edit-item-anatomy.svg"
				alt="Anatomy of a catalogue item: name, price, photo, and description fields in the builder"
				maxWidth="640px"
			/>

			<Prose>
				<h2>Group items into categories</h2>
				<p>
					Categories keep a catalogue tidy. On a menu that might be starters,
					mains, and drinks. In a salon it might be the service types you offer.
					Group related items together and your page stays easy to scan even as
					it grows.
				</p>
			</Prose>

			<ArticleImage
				src="/documentation/build-edit-categories.svg"
				alt="Category management in the Quicktalog builder showing grouped items under named sections"
				maxWidth="640px"
			/>

			<Prose>
				<h2>Add content blocks</h2>
				<p>
					A catalogue is more than a list. Text blocks let you add a welcome
					note, opening hours, or a short story about the business. Dividers
					break the page into clear sections. On higher plans you can also embed
					outside content, like a booking widget or a map, and add custom code
					for anything bespoke.
				</p>
			</Prose>

			<ArticleImage
				src="/documentation/build-edit-content-blocks.svg"
				alt="Content blocks panel in the builder showing text, divider, and embed block options"
				maxWidth="640px"
			/>

			<Prose>
				<h2>Find your way around the tabs</h2>
				<p>
					The settings panel is split into four tabs so each kind of setting has
					its own place. General holds the basics, Header controls the top of
					the page, Footer covers business details and links at the bottom, and
					Appearance is where you change the look. The next topic covers
					Appearance in full.
				</p>
			</Prose>

			<ArticleImage
				src="/documentation/build-edit-settings-tabs.svg"
				alt="The four builder settings tabs: General, Header, Footer, and Appearance"
			/>

			<Callout title="Edit live, publish when ready" variant="note">
				Changes in the builder are saved to your draft, not to the live page.
				Your customers keep seeing the last published version until you publish
				again, so you can rework a catalogue without anyone seeing it half done.
			</Callout>
		</>
	);
}

const doc: DocEntry = { meta, Body };
export default doc;
