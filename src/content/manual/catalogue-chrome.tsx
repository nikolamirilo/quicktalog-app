import { FieldName, PlaceName, TabName } from "@/components/manual/Inline";
import { ManualSection } from "@/components/manual/ManualSection";
import { ManualText } from "@/components/manual/ManualText";
import { Messages } from "@/components/manual/Messages";
import { Note } from "@/components/manual/Note";
import { Option, Options } from "@/components/manual/Options";
import { Rule, Rules } from "@/components/manual/Rules";
import { Step, Steps } from "@/components/manual/Steps";
import { ChromeScreen } from "@/components/manual/screens/ChromeScreen";
import type { ManualPage } from "./_types";

const meta = {
	slug: "catalogue-chrome",
	group: "design",
	title: "Heading, navbar, search and footer",
	inShort:
		"Set the title at the top, your own navbar and footer, and a search bar for your customers.",
	result: "A catalogue that carries your own name, logo and contact details.",
	where: ["Builder", "Editor", "Header or Footer"],
	before: [
		{
			text: "You have a catalogue open in the builder.",
			href: "builder-basics",
		},
	],
	badges: ["Your own navbar needs Basic"],
	keywords: [
		"heading",
		"title",
		"navbar",
		"header",
		"footer",
		"search",
		"logo",
		"social",
		"partners",
	],
	synonyms: [
		"branding",
		"contact details",
		"opening hours",
		"my logo",
		"search box",
	],
	related: ["themes", "background-and-glass", "plans"],
} satisfies ManualPage["meta"];

function Body() {
	return (
		<>
			<ManualSection kind="steps" title="Set your catalogue heading">
				<ManualText className="mb-4">
					<p>
						The heading is the big title at the top of your catalogue. It is
						required before you can publish, and it is edited straight on the
						page rather than in a panel.
					</p>
				</ManualText>
				<Steps>
					<Step title="Select the heading in the builder">
						<p>
							On a new catalogue it reads <PlaceName>+ Add Heading</PlaceName>.
							A small toolbar appears above it.
						</p>
					</Step>
					<Step title="Type your title">
						<p>
							The toolbar offers <FieldName>Bold</FieldName>,{" "}
							<FieldName>Italic</FieldName> and a{" "}
							<FieldName>Heading size</FieldName> of{" "}
							<FieldName>Small</FieldName>, <FieldName>Medium</FieldName>,{" "}
							<FieldName>Large</FieldName> or <FieldName>Extra Large</FieldName>
							. New catalogues use <FieldName>Large</FieldName>.
						</p>
					</Step>
				</Steps>
				<Note kind="warn" title="A heading is capped at 100 characters">
					<p>
						That is 100 characters of text you can see. Going over does not cut
						the text off, it removes your bold and italic instead, so keep it
						short.
					</p>
				</Note>
			</ManualSection>

			<ManualSection kind="opts" title="The navbar">
				<ManualText className="mb-4">
					<p>
						Everything here is in the <TabName>Header</TabName> tab of the
						editor panel.
					</p>
				</ManualText>
				<ChromeScreen />

				<Options>
					<Option
						defaultValue="Off"
						name="Customize header"
						plan="Basic and up"
					>
						<p>
							Off, your catalogue shows the Quicktalog navbar. On, it shows
							yours, with your logo and your own button.
						</p>
					</Option>
					<Option name="Floating navbar">
						<p>
							Keeps the navbar above the catalogue and visible while customers
							scroll, rather than letting it scroll away.
						</p>
					</Option>
					<Option limit="20 to 300px" name="Logo width">
						<p>
							How wide your logo is in the navbar. It stops growing once it
							reaches the height of the bar, so very wide logos simply fill the
							space. Upload the logo itself under <PlaceName>Logo</PlaceName> in
							the <TabName>General</TabName> tab.
						</p>
					</Option>
					<Option name="Header action link">
						<p>
							Adds a button to the navbar, for booking or calling. Nothing
							appears until you fill in a link. Leaving{" "}
							<FieldName>Button label</FieldName> empty shows{" "}
							<FieldName>Learn more</FieldName>.
						</p>
					</Option>
				</Options>
			</ManualSection>

			<ManualSection kind="opts" title="The search bar">
				<ManualText className="mb-4">
					<p>
						A search bar under your heading, so customers can find an item by
						typing part of its name. It is off until you switch it on, and it is
						in the <TabName>General</TabName> tab under{" "}
						<PlaceName>Search</PlaceName>.
					</p>
				</ManualText>
				<Options>
					<Option defaultValue="Off" name="Show search bar">
						<p>
							On every plan, including the free one. When it is on, typing
							filters the items as the customer types, opens any section with a
							match and hides sections with none.
						</p>
					</Option>
					<Option limit="Max 40 characters" name="Placeholder text" optional>
						<p>
							The grey words in the empty bar. Left empty it reads{" "}
							<FieldName>Search items&#8230;</FieldName>.
						</p>
					</Option>
				</Options>
				<Note kind="info" title="Worth switching on for a long menu">
					<p>
						Searching looks at item names and descriptions, ignores accents and
						capitals, and needs all the words typed to match. On a catalogue
						with a handful of items it adds little.
					</p>
				</Note>
			</ManualSection>

			<ManualSection kind="opts" title="The footer">
				<ManualText className="mb-4">
					<p>
						In the <TabName>Footer</TabName> tab. With your own footer switched
						on, Quicktalog builds it only from what you fill in, so an empty
						field means no column rather than an empty one.
					</p>
				</ManualText>
				<Options>
					<Option
						defaultValue="Off"
						name="Customize footer"
						plan="Basic and up"
					>
						<p>Off, customers see the Quicktalog footer. On, they see yours.</p>
					</Option>
					<Option name="Legal business name" optional>
						<p>
							Used in the copyright line at the bottom, and in place of your
							logo if you have not uploaded one. Without it the line reads{" "}
							<FieldName>Your Company</FieldName>.
						</p>
					</Option>
					<Option limit="Max 120 characters" name="Footer tagline" optional>
						<p>
							One line under your logo. A live counter shows how much is left.
						</p>
					</Option>
					<Option name="Business address" optional>
						<p>Shown in the company column.</p>
					</Option>
					<Option name="Terms &amp; conditions link" optional>
						<p>Appears in the bottom bar beside the copyright.</p>
					</Option>
					<Option name="Privacy policy link" optional>
						<p>Also in the bottom bar.</p>
					</Option>
					<Option name="Footer action link" optional>
						<p>
							A button in the footer. As with the header one, nothing appears
							until there is a link. The placeholders suggest{" "}
							<FieldName>Contact Us</FieldName>.
						</p>
					</Option>
					<Option limit="Up to 5" name="Add a profile link" optional>
						<p>
							Your social media profiles. Quicktalog fetches each site&apos;s
							icon for you.
						</p>
					</Option>
					<Option
						defaultValue="Off"
						limit="Up to 3"
						name="Show partners"
						optional
					>
						<p>
							A row of partners, each with a name, a link and a description.
						</p>
					</Option>
					<Option defaultValue="Off" name="Newsletter" plan="Growth and up">
						<p>
							Adds a sign up form to the footer. Anyone who signs up appears in
							the <PlaceName>Newsletter Subscribers</PlaceName> table on your
							dashboard, which you can export as a CSV file.
						</p>
					</Option>
				</Options>
			</ManualSection>

			<ManualSection kind="rules" title="Good to know">
				<Rules>
					<Rule>
						Your logo, your contact details and how your catalogue appears in
						search results all live in the <TabName>General</TabName> tab, not
						the header or footer tabs.
					</Rule>
					<Rule>
						Your own navbar and footer need a Basic plan or higher. On the free
						plan the Quicktalog ones are shown.
					</Rule>
					<Rule>
						Dropping to a smaller plan switches your own navbar and footer back
						to the Quicktalog ones.
					</Rule>
					<Rule>
						Corner radius under <PlaceName>Appearance</PlaceName> shapes the
						navbar and the search bar too. Setting it to 0 makes both square.
					</Rule>
				</Rules>
			</ManualSection>

			<ManualSection kind="fix" title="Messages">
				<Messages
					messages={[
						{
							text: "Upgrade required",
							cause: "The section you opened is not in your plan.",
							fix: "Select Upgrade now to compare plans.",
						},
					]}
				/>
			</ManualSection>
		</>
	);
}

const page: ManualPage = { Body, meta };
export default page;
