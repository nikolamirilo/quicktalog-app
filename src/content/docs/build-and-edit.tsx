import { ArticleImage } from "@/components/resources/ArticleImage";
import { Callout } from "@/components/resources/Callout";
import { KeyTakeaways } from "@/components/resources/KeyTakeaways";
import { Prose } from "@/components/resources/Prose";
import { Stepper } from "@/components/resources/Stepper";
import { FiEdit3 } from "react-icons/fi";
import type { DocEntry } from "./_types";

const meta = {
	slug: "build-and-edit",
	title: "Build and Edit Your Catalogue",
	description:
		"How the Quicktalog builder works: add and edit items, group them into sections, choose a layout, add other kinds of content, and know when a change goes live.",
	tag: "Build",
	icon: FiEdit3,
	order: 3,
	readingTimeMinutes: 6,
	keywords: [
		"catalogue builder",
		"edit catalogue items",
		"catalogue sections",
		"content blocks",
		"publish catalogue",
	],
	relatedSlugs: ["quick-ai", "customize-design"],
} satisfies DocEntry["meta"];

function Body() {
	return (
		<>
			<ArticleImage
				alt="The Quicktalog builder showing a live catalogue preview alongside the settings panel"
				priority
				src="/images/documentation/build-edit-cover.svg"
			/>

			<Prose>
				<p>
					The builder is where a draft becomes a real catalogue. The middle of
					the screen is your catalogue exactly as a customer will see it, and
					you edit it in place: tap a section to change it, tap an item to open
					it. Around that sit the controls, and a settings panel for everything
					that applies to the whole page.
				</p>
			</Prose>

			<KeyTakeaways
				points={[
					"Items are the core of a catalogue: a name, a price, a photo, and a short description.",
					"Sections group items, and a layout decides how each group is drawn.",
					"Text and dividers break the page up; external content and custom visuals come in on higher plans.",
					"Save keeps your work private. Publish is what customers see.",
				]}
			/>

			<Prose>
				<h2>Add and edit items</h2>
				<p>
					An item is a single thing you offer. Add one, then give it a name, a
					price, a photo, and a short description. Good photos and a clear line
					of description do most of the selling, so spend the time on the items
					that matter most. If a description is slow to come, the field has a
					button that writes one from the item&apos;s name.
				</p>
				<p>
					A price can carry a unit where that helps, like per kg or per portion.
					You can mark an item as free rather than priced, or put it on
					discount, in which case the old price is shown struck through beside
					the new one. Every item has its own ⋮ menu for moving it up or down,
					sending it to another section, or deleting it.
				</p>
			</Prose>

			<Stepper
				steps={[
					{
						title: "Add an item",
						description:
							"Create a new item in the section you want it to sit in. It appears in the preview straight away, ready to fill.",
					},
					{
						title: "Fill in the details",
						description:
							"Set the name, price, and a short description. Add a photo for anything you want to stand out.",
					},
					{
						title: "Arrange the order",
						description:
							"Put your strongest items near the top of their section. People scan from the top, so lead with what sells.",
					},
				]}
			/>

			<ArticleImage
				alt="Anatomy of a catalogue item: name, price, photo, and description fields in the builder"
				maxWidth="640px"
				src="/images/documentation/build-edit-item-anatomy.svg"
			/>

			<Prose>
				<h2>Group items into sections</h2>
				<p>
					Sections keep a catalogue tidy. On a menu that might be starters,
					mains, and drinks. In a salon it might be the service types you offer.
					Group related items together and your page stays easy to scan even as
					it grows.
				</p>
				<p>
					A section can show its name as a heading, which doubles as a control
					your visitors can tap to fold it away, or it can be a plain grid with
					no heading at all. Each one carries a ⋯ menu with everything you can
					do to it: edit it, change its layout, move it up or down, or delete
					it.
				</p>

				<h3>Choose a layout</h3>
				<p>
					The layout decides how the items in one section are drawn, and each
					section can use a different one. There are four: an image beside the
					text, an image above it, text only for lists where photos would get in
					the way, and a carousel your visitors swipe through. Switching between
					them takes one tap, so it is worth trying a couple on your longest
					section.
				</p>
			</Prose>

			<ArticleImage
				alt="Section management in the Quicktalog builder showing grouped items under named sections"
				maxWidth="640px"
				src="/images/documentation/build-edit-categories.svg"
			/>

			<Prose>
				<h2>Add other kinds of content</h2>
				<p>
					A catalogue is more than a list, so a section does not have to hold
					items. When you add one, you choose what kind it is.
				</p>
				<ul>
					<li>
						<strong>Items</strong> - your products or services, with prices and
						photos. On every plan.
					</li>
					<li>
						<strong>Text</strong> - a welcome note, your opening hours, or a
						short story about the business. On every plan, and text blocks do
						not count against the number of sections your plan allows.
					</li>
					<li>
						<strong>Divider</strong> - a horizontal rule that breaks the page
						into clear parts.
					</li>
					<li>
						<strong>External content</strong> - something from another service
						embedded into the page, like a map, a video, or a booking widget.
						You paste in the snippet that service gives you.
					</li>
					<li>
						<strong>Custom visual</strong> - a banner, an animation, or a small
						interactive piece designed for your page. Quick AI can write one for
						you if you describe what you want.
					</li>
				</ul>
				<p>
					The last three come in on paid plans. If one is not part of yours, the
					builder says which plan adds it rather than letting you build
					something you cannot publish.
				</p>
			</Prose>

			<ArticleImage
				alt="The add-section panel in the builder showing items, text, divider, external content, and custom visual options"
				maxWidth="640px"
				src="/images/documentation/build-edit-content-blocks.svg"
			/>

			<Prose>
				<h2>Find your way around the tabs</h2>
				<p>
					The settings panel holds everything that applies to the whole page
					rather than one section, split into four tabs. General has the basics:
					your heading, logo, contact details, and how the page is titled when
					someone shares the link. Header controls the bar above the catalogue
					and Footer the one below it. Appearance is where you change the look,
					which the next topic but one covers in full.
				</p>
				<p>
					On higher plans the General tab also has an{" "}
					<strong>Analytics &amp; tracking</strong> section. Turn on Google
					Analytics or Meta Pixel, then paste your Measurement ID or Pixel ID.
					Turning a switch off removes that tag when you save. Visitors are
					asked to allow analytics before anything loads, and nothing loads if
					they decline, so remember to mention these tools in your privacy
					policy. Google Tag Manager is not supported, because a container can
					run any code on your page.
				</p>
			</Prose>

			<ArticleImage
				alt="The four builder settings tabs: General, Header, Footer, and Appearance"
				src="/images/documentation/build-edit-settings-tabs.svg"
			/>

			<Prose>
				<h2>Save, preview, publish</h2>
				<p>
					Three buttons, three different things, and the difference is worth
					learning once.
				</p>
				<ul>
					<li>
						<strong>Save</strong> keeps your work in progress. Nothing a
						customer sees changes.
					</li>
					<li>
						<strong>Preview</strong> opens the saved draft as a visitor would
						see it, without the builder controls on top of it.
					</li>
					<li>
						<strong>Publish</strong> pushes the draft live. This is the only one
						that changes what is on your link.
					</li>
				</ul>
			</Prose>

			<Callout title="Edit freely, publish when ready" variant="note">
				Because editing and publishing are separate, you can rework a whole
				catalogue over several days without anyone seeing it half done. Your
				customers keep seeing the last published version until you publish
				again.
			</Callout>
		</>
	);
}

const doc: DocEntry = { meta, Body };
export default doc;
