import {
	ButtonName,
	FieldName,
	PlaceName,
	TabName,
} from "@/components/manual/Inline";
import { ManualSection } from "@/components/manual/ManualSection";
import { ManualTable } from "@/components/manual/ManualTable";
import { ManualText } from "@/components/manual/ManualText";
import { Messages } from "@/components/manual/Messages";
import { Note } from "@/components/manual/Note";
import { Option, Options } from "@/components/manual/Options";
import { Rule, Rules } from "@/components/manual/Rules";
import { Step, Steps } from "@/components/manual/Steps";
import { Term } from "@/components/manual/Term";
import { AppearanceScreen } from "@/components/manual/screens/AppearanceScreen";
import type { ManualPage } from "./_types";

const meta = {
	slug: "themes",
	group: "design",
	title: "Themes, colours and fonts",
	inShort:
		"Change how your catalogue looks, from a ready theme to your own colours.",
	result: "A catalogue in your own colours, font and shape.",
	where: ["Builder", "Editor", "Appearance"],
	before: [
		{
			text: "You have a catalogue open in the builder.",
			href: "builder-basics",
		},
	],
	badges: ["Custom colours need Pro"],
	keywords: [
		"theme",
		"colours",
		"colors",
		"font",
		"corner radius",
		"shadow",
		"appearance",
	],
	synonyms: ["branding", "style", "look", "palette", "typeface", "dark mode"],
	related: ["catalogue-chrome", "background-and-glass", "plans"],
} satisfies ManualPage["meta"];

function Body() {
	return (
		<>
			<ManualSection kind="steps" title="Pick a theme">
				<Steps>
					<Step
						title={
							<>
								Open <PlaceName>Editor</PlaceName> in the builder rail, then the{" "}
								<TabName>Appearance</TabName> tab
							</>
						}
					/>
					<Step title="Choose one of the theme tiles">
						<p>
							Each tile is drawn in that theme&apos;s own colours, so the grid
							is its own preview. Five tiles show at first, with{" "}
							<ButtonName variant="secondary">Show more themes</ButtonName> for
							the rest.
						</p>
					</Step>
					<Step
						done="Your catalogue redraws immediately, and customers see it once you publish."
						title="Save your draft"
					/>
				</Steps>
				<AppearanceScreen />

				<ManualTable
					caption="The seven themes you can choose"
					columns={["Theme", "What it looks like"]}
					rows={[
						[
							"Monochrome",
							"Near white page, black text and buttons, white cards. Plain and high contrast. This is what a new catalogue starts with.",
						],
						[
							"Elegant",
							"Almost black page with a soft dark gradient, off white text and cool blue accents.",
						],
						[
							"Organic",
							"Warm beige page with muted green text and accents, and a soft gold second colour.",
						],
						[
							"Modern",
							"Deep navy purple page, white text, violet buttons and a pink price colour.",
						],
						[
							"Luxury",
							"Cream page, near black text, white cards, gold buttons and accents.",
						],
						[
							"Creative",
							"Very dark blue grey page with coral red, blue and yellow accents on lifted cards.",
						],
						[
							"Coffee",
							"Warm oat page with a faint woven pattern, dark brown text and ochre accents.",
						],
					]}
				/>
				<Note kind="info" title="Themes are on every plan">
					<p>
						All seven are available to everyone, including the free Starter
						plan. It is only your <em>own</em> colours that need a bigger plan.
					</p>
				</Note>
			</ManualSection>

			<ManualSection kind="opts" title="Shape and type">
				<ManualText className="mb-4">
					<p>
						These four sit under <PlaceName>Style</PlaceName> in the same tab
						and work with any theme.
					</p>
				</ManualText>
				<Options>
					<Option defaultValue="Inter" name="Font style">
						<p>
							One choice of 19, which sets both your headings and your body
							text. Each option in the list is shown in its own typeface.{" "}
							<FieldName>Arial</FieldName> uses the reader&apos;s own copy; the
							rest are web fonts. There is no separate heading font setting, and
							weights are fixed.
						</p>
					</Option>
					<Option
						defaultValue="Medium"
						name="Content font size"
						values={["Small", "Medium", "Large"]}
					>
						<p>
							How big item names and descriptions are. It does not change your
							catalogue heading.
						</p>
					</Option>
					<Option defaultValue="12px" limit="0 to 16px" name="Corner radius">
						<p>
							How round the corners are on cards, section headings, images, the
							navbar and the search bar. Setting it to 0 makes the navbar and
							search bar square too.
						</p>
					</Option>
					<Option
						defaultValue="Low"
						name="Shadow"
						values={["None", "Low", "Medium", "High"]}
					>
						<p>How much your cards lift off the page.</p>
					</Option>
				</Options>
			</ManualSection>

			<ManualSection kind="opts" title="Your own colours">
				<ManualText className="mb-4">
					<p>
						On a Pro plan or higher, a <PlaceName>Custom</PlaceName> tile
						appears first in the theme grid. Choosing it reveals five colours.
					</p>
				</ManualText>
				<Options>
					<Option defaultValue="#f3f3f3" name="Page background">
						<p>Behind everything.</p>
					</Option>
					<Option defaultValue="#000000" name="Titles">
						<p>Your catalogue heading and section headings.</p>
					</Option>
					<Option defaultValue="#ffffff" name="Card background">
						<p>Behind each item.</p>
					</Option>
					<Option defaultValue="#1a1a1a" name="Item text">
						<p>Item names and descriptions.</p>
					</Option>
					<Option defaultValue="#000000" name="Buttons and prices">
						<p>Prices and any buttons.</p>
					</Option>
				</Options>
				<Note kind="info" title="One pair of colours is checked for you">
					<p>
						Quicktalog checks that your item text can be read against your card
						background, and corrects it and tells you if it cannot. Nothing
						checks your titles against your page background, so look at the
						result yourself after changing those two.
					</p>
				</Note>
				<Note kind="warn" title="A half typed colour is dropped quietly">
					<p>
						A colour has to be a full six digit code such as{" "}
						<code>#1a1a1a</code>. Anything shorter is thrown away when you save
						and the default comes back, with no message. Use the colour swatch
						beside the field if you are unsure.
					</p>
				</Note>
			</ManualSection>

			<ManualSection kind="rules" title="Good to know">
				<Rules>
					<Rule>
						Each catalogue has its own <Term name="theme" />. Changing one never
						changes another.
					</Rule>
					<Rule>
						Switching from your own colours back to a ready theme throws the
						custom colours away.
					</Rule>
					<Rule>
						On Pro and above you can save a set of colours as a named theme and
						reuse it. Saved themes appear before the ready made ones, and five
						of them will push the standard themes behind{" "}
						<ButtonName variant="secondary">Show more themes</ButtonName>.
					</Rule>
					<Rule>
						Design changes show in the builder at once, but customers only see
						them after you publish.
					</Rule>
					<Rule>
						Dropping to a smaller plan erases your custom colours, along with
						the background, glass and overlay settings.
					</Rule>
					<Rule>
						Quick AI can change the theme, the font, the size, the corners, the
						shadow and your custom colours. It cannot touch the background, the
						glass effect or the overlay.
					</Rule>
				</Rules>
			</ManualSection>

			<ManualSection kind="fix" title="Messages">
				<Messages
					messages={[
						{
							text: "Upgrade required",
							cause:
								"A group of settings your plan does not include. The line under it reads that you can upgrade your plan to unlock the feature.",
							fix: "Select Upgrade now to compare plans, or use a ready made theme instead.",
						},
					]}
				/>
			</ManualSection>
		</>
	);
}

const page: ManualPage = { Body, meta };
export default page;
