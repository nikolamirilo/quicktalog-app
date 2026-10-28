import {
	ButtonName,
	FieldName,
	PlaceName,
	Tag,
} from "@/components/manual/Inline";
import { ManualSection } from "@/components/manual/ManualSection";
import { ManualTable } from "@/components/manual/ManualTable";
import { ManualText } from "@/components/manual/ManualText";
import { Messages } from "@/components/manual/Messages";
import { Note } from "@/components/manual/Note";
import { Option, Options } from "@/components/manual/Options";
import { Rule, Rules } from "@/components/manual/Rules";
import { TextBlockScreen } from "@/components/manual/screens/TextBlockScreen";
import type { ManualPage } from "./_types";

const meta = {
	slug: "blocks",
	group: "builder",
	title: "Text, dividers and embedded content",
	inShort:
		"Use the four kinds of section that do not hold items, and know which plan each needs.",
	result:
		"A catalogue with paragraphs, spacing, a map or video, or something you built yourself.",
	where: ["Builder", "Add Section"],
	before: [{ text: "You know how to add a section.", href: "sections" }],
	badges: ["Some parts need a paid plan"],
	keywords: [
		"text",
		"divider",
		"embed",
		"external content",
		"custom visual",
		"html",
		"map",
		"video",
		"iframe",
	],
	synonyms: [
		"paragraph",
		"rich text",
		"separator",
		"spacer",
		"youtube",
		"google maps",
		"calendly",
		"custom code",
		"widget",
	],
	related: ["sections", "plans", "items"],
} satisfies ManualPage["meta"];

function Body() {
	return (
		<>
			<ManualSection kind="info" title="Which one do I need?">
				<ManualTable
					caption="The four kinds of section that do not hold items"
					columns={["I want to", "Use", "Plan"]}
					rows={[
						[
							"Write a paragraph, a list or opening hours",
							<PlaceName key="t">Text</PlaceName>,
							<Tag key="p" kind="lim">
								Every plan
							</Tag>,
						],
						[
							"Put space or a line between two sections",
							<PlaceName key="t">Divider</PlaceName>,
							<Tag key="p" kind="plan">
								Basic and up
							</Tag>,
						],
						[
							"Show a map, a video or a booking form from another site",
							<PlaceName key="t">External content</PlaceName>,
							<Tag key="p" kind="plan">
								Pro and up
							</Tag>,
						],
						[
							"Build a banner or small interactive thing myself",
							<PlaceName key="t">Custom visual</PlaceName>,
							<Tag key="p" kind="plan">
								Pro and up
							</Tag>,
						],
					]}
				/>
				<Note kind="info" title="Locked kinds are shown, not hidden">
					<p>
						A kind your plan does not include appears in the dialog with a
						padlock. You can see what exists without being able to add it.
					</p>
				</Note>
			</ManualSection>

			<ManualSection kind="opts" title="Text">
				<ManualText className="mb-4">
					<p>
						A run of formatted writing, with no heading or frame of its own. Use
						it for a welcome paragraph, opening hours, allergy notes or terms.
					</p>
				</ManualText>
				<TextBlockScreen />

				<Options>
					<Option name="Section name" optional>
						<p>
							Not shown on the page. It describes the section for screen readers
							and labels it for you in the builder.
						</p>
					</Option>
					<Option name="Content" optional>
						<p>
							The writing itself, with a toolbar for <FieldName>Bold</FieldName>
							, <FieldName>Italic</FieldName>, <FieldName>Underline</FieldName>,
							bulleted and numbered lists, left, centre and right alignment, and
							four text sizes from <FieldName>Small</FieldName> to{" "}
							<FieldName>Extra Large</FieldName>. Left empty, the section is
							saved with the words <q>New text block</q> in it.
						</p>
					</Option>
				</Options>
				<Note kind="warn" title="Pasting drops the formatting">
					<p>
						Text pasted from a document or a web page arrives as plain text. Use
						the toolbar to format it again. Markdown does not work here either,
						so <code>**bold**</code> stays as it is written.
					</p>
				</Note>
			</ManualSection>

			<ManualSection kind="opts" title="Divider">
				<ManualText className="mb-4">
					<p>
						Space between two sections, with or without a line across it. Needs
						a Basic plan or higher.
					</p>
				</ManualText>
				<Options>
					<Option name="Section name" optional>
						<p>Only for finding the section again in the builder.</p>
					</Option>
					<Option
						defaultValue="2rem"
						limit="0 to 10rem"
						name="Vertical spacing"
					>
						<p>
							How much room the divider takes. The number is the total, split
							evenly above and below, so 2rem puts 1rem on each side.
						</p>
					</Option>
					<Option defaultValue="Off" name="Show a border line">
						<p>
							Draws a visible line. With it off the divider is empty space,
							which is often all you need.
						</p>
					</Option>
					<Option
						defaultValue="Solid"
						name="Style"
						values={["Solid", "Dashed", "Dotted"]}
					>
						<p>What the line looks like.</p>
					</Option>
					<Option defaultValue="1px" limit="1 to 10px" name="Thickness">
						<p>How thick the line is.</p>
					</Option>
					<Option defaultValue="#000000" name="Colour">
						<p>The colour of the line.</p>
					</Option>
					<Option defaultValue="100%" limit="0 to 100%" name="Opacity">
						<p>
							How solid the line is. Lower numbers give a softer line that sits
							behind your content rather than cutting across it.
						</p>
					</Option>
				</Options>
			</ManualSection>

			<ManualSection kind="opts" title="External content">
				<ManualText className="mb-4">
					<p>
						Something from another website shown inside your catalogue: a map, a
						video, a booking calendar, a payment button. You paste in the embed
						code that site gives you. Needs a Pro plan or higher.
					</p>
				</ManualText>
				<Options>
					<Option name="Section name" optional>
						<p>Names the section for screen readers and in the builder.</p>
					</Option>
					<Option
						name="What would you like to embed?"
						values={["Maps", "Booking", "Media", "Commerce", "Social Media"]}
					>
						<p>
							A hint, not a setting. Choosing one changes the example wording in
							the box below it. Nothing about your section changes.
						</p>
					</Option>
					<Option name="Embed code" required>
						<p>
							The code the other site gives you, usually from a{" "}
							<FieldName>Share</FieldName> then <FieldName>Embed</FieldName>{" "}
							option. Paste it whole. The add button stays switched off until
							there is something in this box.
						</p>
					</Option>
				</Options>
				<Note
					kind="warn"
					title="Only certain sites are allowed, and scripts never run"
				>
					<p>
						For safety, Quicktalog keeps embeds only from sites it knows,
						including Google Maps, OpenStreetMap, YouTube, Vimeo, Spotify,
						SoundCloud, Twitch, Calendly, Booking.com, Airbnb, Stripe, PayPal,
						Ko-fi, Instagram, Facebook, TikTok, X and LinkedIn. An embed from
						anywhere else is dropped and nothing appears.
					</p>
					<p>
						Quicktalog also removes any script from the code. Embeds that work
						by running a script, which includes most Instagram and TikTok post
						embeds, will show only their plain fallback text. Embeds that use a
						frame, such as YouTube and Google Maps, work normally.
					</p>
				</Note>
			</ManualSection>

			<ManualSection kind="opts" title="Custom visual">
				<ManualText className="mb-4">
					<p>
						Your own HTML, CSS and JavaScript, for a banner, an animation or a
						small interactive object. Needs a Pro plan or higher. This one is
						for people comfortable writing a little code.
					</p>
				</ManualText>
				<Options>
					<Option name="Section name" optional>
						<p>
							Used as the name of the frame your code runs in. Left empty it
							reads <FieldName>Custom content</FieldName>.
						</p>
					</Option>
					<Option name="HTML code" required>
						<p>
							A code editor with syntax colouring and word wrap. Use{" "}
							<ButtonName variant="secondary">Expand editor</ButtonName> for
							more room. Put your CSS and JavaScript in the same box, inside{" "}
							<code>style</code> and <code>script</code> tags.
						</p>
					</Option>
				</Options>
				<Note kind="info" title="Your code runs in a sealed frame">
					<p>
						Scripts here do run, but the frame cannot reach cookies, storage,
						the rest of your page, or anything signed in. That keeps your
						visitors safe, and it means analytics and tracking tags cannot work
						here. Use <PlaceName>Analytics &amp; tracking</PlaceName> in the{" "}
						<PlaceName>General</PlaceName> tab for those.
					</p>
				</Note>
			</ManualSection>

			<ManualSection kind="rules" title="Good to know">
				<Rules>
					<Rule>
						Every one of these counts as a section against your plan, a plain
						divider included.
					</Rule>
					<Rule>
						None of them hold items. Only an <PlaceName>Items</PlaceName>{" "}
						section does.
					</Rule>
					<Rule>
						In the builder these sections are labelled with a small chip. The
						chip on an external content section reads{" "}
						<PlaceName>Embed</PlaceName>, although the dialog calls it{" "}
						<PlaceName>External content</PlaceName>.
					</Rule>
					<Rule>
						A text section can also be edited straight on the page: select it,
						make your changes, then select{" "}
						<ButtonName variant="secondary">Done</ButtonName>.
					</Rule>
					<Rule>
						Quick AI can add and change text, dividers, external content and
						custom visuals, but not the glass effect or the background.
					</Rule>
				</Rules>
			</ManualSection>

			<ManualSection kind="fix" title="Messages">
				<Messages
					messages={[
						{
							text: "No embed code provided",
							cause:
								"An external content section was saved with an empty code box.",
							fix: "Open the section and paste the embed code in.",
						},
						{
							text: "Upgrade required",
							cause: "The kind of section you chose is not in your plan.",
							fix: "Select Upgrade now to see the plans, or pick a kind your plan includes.",
						},
					]}
				/>
				<Note kind="info" title="An embed that shows nothing">
					<p>
						If a section is simply blank, the embed almost certainly came from a
						site that is not on the allowed list, or it needed a script. Nothing
						is reported, because the code was accepted and then filtered when
						the page was drawn. Try the embed from one of the sites listed
						above.
					</p>
				</Note>
			</ManualSection>
		</>
	);
}

const page: ManualPage = { Body, meta };
export default page;
