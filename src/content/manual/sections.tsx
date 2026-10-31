import { ButtonName, FieldName, PlaceName } from "@/components/manual/Inline";
import { ManualSection } from "@/components/manual/ManualSection";
import { ManualTable } from "@/components/manual/ManualTable";
import { ManualText } from "@/components/manual/ManualText";
import { Messages } from "@/components/manual/Messages";
import { Note } from "@/components/manual/Note";
import { Option, Options } from "@/components/manual/Options";
import { Rule, Rules } from "@/components/manual/Rules";
import { FollowAlong } from "@/components/manual/Screen";
import { AddSectionScreen } from "@/components/manual/screens/AddSectionScreen";
import { Step, Steps } from "@/components/manual/Steps";
import { Term } from "@/components/manual/Term";
import type { ManualPage } from "./_types";

const meta = {
	slug: "sections",
	group: "builder",
	title: "Add and arrange sections",
	inShort:
		"Add a section to your catalogue, set how it behaves, and move it into place.",
	result: "A section with a heading, in the right place in your catalogue.",
	where: ["Builder", "Add Section"],
	before: [
		{
			text: "You have a catalogue open in the builder.",
			href: "builder-basics",
		},
	],
	keywords: [
		"section",
		"add section",
		"heading",
		"layout",
		"collapse",
		"reorder",
	],
	synonyms: ["category", "block", "group", "chapter", "menu section"],
	related: ["items", "blocks", "limits"],
} satisfies ManualPage["meta"];

function Body() {
	return (
		<>
			<ManualSection kind="info" title="How a catalogue is built">
				<ManualText>
					<p>
						A catalogue is a heading followed by a stack of{" "}
						<Term name="section" />
						s. Sections come in five kinds. The <PlaceName>Items</PlaceName>{" "}
						kind is the one that holds things with names and prices. The other
						four add text, a dividing line, content from another site, or
						something you build yourself.
					</p>
					<p>
						Every kind counts towards the section allowance on your plan,
						including a plain dividing line. Your catalogue heading does not
						count.
					</p>
				</ManualText>
			</ManualSection>

			<ManualSection kind="steps" title="Add a section">
				<FollowAlong screen={<AddSectionScreen />}>
					<Steps>
						<Step
							title={
								<>
									Select the dashed <ButtonName>Add Section</ButtonName> tile
								</>
							}
						>
							<p>
								It sits under the last section in your catalogue. The dialog
								opens on the list of kinds.
							</p>
						</Step>
						<Step spot={1} title="Pick the kind of section">
							<p>
								<PlaceName>Items</PlaceName> is selected for you. Kinds your
								plan does not include show a padlock and cannot be chosen.
							</p>
						</Step>
						<Step spot={4} title="Fill in the settings and add it">
							<p>
								For an items section you need a heading. The add button stays
								switched off until you type one.
							</p>
						</Step>
						<Step
							done="A toast reads &quot;Catalogue saved successfully&quot;."
							title="Save your draft"
						>
							<p>
								Adding a section does not save it. Select{" "}
								<ButtonName variant="secondary">Save</ButtonName> in the rail.
							</p>
						</Step>
					</Steps>
				</FollowAlong>
			</ManualSection>

			<ManualSection kind="opts" title="Settings for an items section">
				<Options>
					<Option name="Heading" required>
						<p>
							The title your customers read above the items, such as{" "}
							<FieldName>Breakfast</FieldName>. When{" "}
							<FieldName>Show heading</FieldName> is off this field is labelled{" "}
							<PlaceName>Section name</PlaceName> instead, is not shown to
							customers, and is only used to name the section when you move
							items between sections.
						</p>
					</Option>
					<Option defaultValue="On" name="Show heading">
						<p>
							Draws a title bar above the items. The title bar is also what
							customers tap to fold the section away, so a section without a
							heading can never be folded.
						</p>
					</Option>
					<Option defaultValue="On" name="Auto-expand">
						<p>
							Opens the section when the page loads. Switch it off to have
							customers arrive with the section folded, which suits a long list
							they can open if they want it. This setting is greyed out until{" "}
							<FieldName>Show heading</FieldName> is on.
						</p>
					</Option>
					<Option
						defaultValue="Side Image"
						name="Layout"
						values={["Side Image", "Top Image", "Text Only", "Carousel"]}
					>
						<p>
							How the items in this section are arranged. Each section has its
							own layout, and you can change it later from the section&apos;s
							actions menu. <FieldName>Text Only</FieldName> hides the picture
							on every item in that section, including the picture field when
							you edit one.
						</p>
					</Option>
				</Options>
				<Note kind="info" title="There is no column setting">
					<p>
						The number of items per row comes from the layout you pick and the
						width of your customer&apos;s screen. You cannot set it yourself.
					</p>
				</Note>
			</ManualSection>

			<ManualSection kind="steps" title="Move, edit or delete a section">
				<ManualText className="mb-4">
					<p>
						Every section has an actions menu in the builder, reached from the
						three dots beside its heading. A section with no heading of its own
						gets a small row above it with its kind and the same menu.
					</p>
				</ManualText>
				<ManualTable
					caption="What the section actions menu offers"
					columns={["Menu item", "What it does"]}
					rows={[
						[
							<PlaceName key="t">Edit section</PlaceName>,
							"Opens the settings above again.",
						],
						[
							<PlaceName key="t">Layout</PlaceName>,
							"Switches between the four item layouts. Items sections only.",
						],
						[
							<PlaceName key="t">Move up</PlaceName>,
							"Swaps this section with the one above. Greyed out on the first section.",
						],
						[
							<PlaceName key="t">Move down</PlaceName>,
							"Swaps this section with the one below. Greyed out on the last section.",
						],
						[
							<PlaceName key="t">Delete section</PlaceName>,
							"Removes the section and everything in it, after your browser asks you to confirm.",
						],
					]}
				/>
			</ManualSection>

			<ManualSection
				kind="risk"
				title="Deleting a section takes its items with it"
			>
				<ManualText>
					<p>
						Deleting a section deletes every item inside it. There is no undo.
						If you want to keep the items, use{" "}
						<PlaceName>Move to section</PlaceName> on each one first, then
						delete the empty section.
					</p>
					<p>
						If you delete something by accident and have not saved yet, reload
						the builder. You will be back at your last saved draft.
					</p>
				</ManualText>
			</ManualSection>

			<ManualSection kind="rules" title="Good to know">
				<Rules>
					<Rule>
						New sections are added at the end of the catalogue. Move them up
						from there.
					</Rule>
					<Rule>
						There is no drag and drop. Reordering is one step at a time with{" "}
						<PlaceName>Move up</PlaceName> and <PlaceName>Move down</PlaceName>.
					</Rule>
					<Rule>
						In the builder every section is shown open, whatever{" "}
						<FieldName>Auto-expand</FieldName> is set to, so that you can always
						reach the items.
					</Rule>
					<Rule>
						Whether a customer folded a section is forgotten when they leave.
						Each visit starts from your <FieldName>Auto-expand</FieldName>{" "}
						setting.
					</Rule>
					<Rule>
						When a visitor searches your catalogue, matching sections open
						themselves and sections with no match are hidden.
					</Rule>
					<Rule>
						Editing an items section never changes the items inside it. The two
						are edited separately.
					</Rule>
				</Rules>
			</ManualSection>

			<ManualSection kind="fix" title="Messages">
				<Messages
					messages={[
						{
							text: "Are you sure you want to delete this section?",
							cause:
								"You chose Delete section. This is your browser's own dialog.",
							fix: "Confirm to delete it with everything inside, or cancel.",
						},
						{
							text: "Invalid data for this section",
							cause:
								"The section's stored content could not be read. This should not happen in normal use.",
							fix: "Open the section in the builder and set it up again, or delete it and add a new one.",
						},
						{
							text: "Nothing here yet",
							cause:
								"A published catalogue with no sections at all. Customers see this, followed by a line inviting you to add your first item.",
							fix: "Add at least one section and publish again.",
						},
					]}
				/>
			</ManualSection>
		</>
	);
}

const page: ManualPage = { Body, meta };
export default page;
