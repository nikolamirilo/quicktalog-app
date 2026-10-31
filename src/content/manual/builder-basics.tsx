import {
	ButtonName,
	KeyName,
	PlaceName,
	TabName,
} from "@/components/manual/Inline";
import { ManualSection } from "@/components/manual/ManualSection";
import { ManualTable } from "@/components/manual/ManualTable";
import { ManualText } from "@/components/manual/ManualText";
import { Messages } from "@/components/manual/Messages";
import { Note } from "@/components/manual/Note";
import { Rule, Rules } from "@/components/manual/Rules";
import { Point, ScreenProvider } from "@/components/manual/Screen";
import { BuilderScreen } from "@/components/manual/screens/BuilderScreen";
import { Step, Steps } from "@/components/manual/Steps";
import { Term } from "@/components/manual/Term";
import type { ManualPage } from "./_types";

const meta = {
	slug: "builder-basics",
	group: "builder",
	title: "Work in the builder",
	inShort:
		"Learn the builder frame, and the difference between saving your work and publishing it.",
	result:
		"You can edit a catalogue, keep your work safely, and know exactly when customers see it.",
	where: ["Dashboard", "A catalogue card", "Edit"],
	before: [{ text: "You have a catalogue to edit.", href: "create-catalogue" }],
	keywords: [
		"builder",
		"save",
		"publish",
		"draft",
		"preview",
		"editor panel",
		"rail",
	],
	synonyms: ["edit", "editor", "autosave", "unsaved changes", "how to save"],
	related: ["sections", "publish", "quick-ai"],
} satisfies ManualPage["meta"];

function Body() {
	return (
		<>
			<ScreenProvider>
				<ManualSection kind="info" title="The builder frame">
					<ManualText className="mb-4">
						<p>
							The builder shows your catalogue exactly as customers will see it,
							with editing controls on top. The tool rail is on the right.{" "}
							<Point n={1} /> opens the editor panel for the name, header,
							footer and appearance. <Point n={2} /> saves. <Point n={3} />{" "}
							publishes. The dashed tile at the bottom <Point n={5} /> adds a
							section, and <Point n={6} /> opens <Term name="builder" />
							&apos;s assistant.
						</p>
					</ManualText>
					<BuilderScreen />
					<Note kind="info" title="On a phone the rail becomes a bar">
						<p>
							Below 720 pixels wide the tools move to a bar along the bottom,
							with a round <PlaceName>Editor</PlaceName> button in the middle.{" "}
							<ButtonName variant="secondary">Preview</ButtonName> and{" "}
							<ButtonName>Publish</ButtonName> share one button there.
						</p>
					</Note>
				</ManualSection>
			</ScreenProvider>

			<ManualSection kind="info" title="Saving and publishing are different">
				<ManualText className="mb-4">
					<p>
						This is the one thing worth learning before anything else. Your
						catalogue exists twice: as a private draft that you edit, and as the
						published page your customers open.
					</p>
				</ManualText>
				<ManualTable
					caption="What Save, Preview and Publish each do"
					columns={["Control", "What it does", "Do customers see it?"]}
					rows={[
						[
							<ButtonName key="b" variant="secondary">
								Save
							</ButtonName>,
							"Keeps your draft so you can close the tab and come back to it.",
							"No. Never.",
						],
						[
							<ButtonName key="b" variant="secondary">
								Preview
							</ButtonName>,
							"Saves first, then opens your draft on a private address that only you can open.",
							"No. The address is yours alone.",
						],
						[
							<ButtonName key="b">Publish</ButtonName>,
							"Copies your draft onto the public page and switches the catalogue on.",
							"Yes. This is the only control that changes the public page.",
						],
					]}
				/>
				<Note kind="warn" title="Nothing saves by itself">
					<p>
						There is no autosave and no keyboard shortcut for saving. If you
						close the tab without selecting{" "}
						<ButtonName variant="secondary">Save</ButtonName>, your changes
						since the last save are gone. Quicktalog warns you first, but the
						warning is the only safety net.
					</p>
				</Note>
				<Note kind="info" title="Your draft is kept for 30 days">
					<p>
						A saved draft stays for 30 days from the last save. Publishing
						writes it to the permanent record.
					</p>
				</Note>
			</ManualSection>

			<ManualSection kind="steps" title="Save your work">
				<Steps>
					<Step
						done='A toast reads "Catalogue saved successfully".'
						title={
							<>
								Select <ButtonName variant="secondary">Save</ButtonName> in the
								rail
							</>
						}
					>
						<p>
							The toast reads{" "}
							<ButtonName variant="secondary">Saving...</ButtonName> while it
							works. Save is never switched off, so you can use it at any time.
						</p>
					</Step>
				</Steps>
				<Note kind="info" title="If you try to leave with unsaved changes">
					<p>
						Moving to another page in Quicktalog, or using the browser Back
						button, opens a dialog titled <PlaceName>Unsaved Changes</PlaceName>{" "}
						that asks{" "}
						<q>You have unsaved changes. Are you sure you want to leave?</q>.
						Choose <ButtonName variant="secondary">Stay</ButtonName> to go back
						to your work, or <ButtonName>Leave</ButtonName> to throw the changes
						away. Reloading or closing the tab shows your browser&apos;s own
						version of the same warning.
					</p>
				</Note>
			</ManualSection>

			<ManualSection kind="opts" title="The editor panel">
				<ManualText className="mb-4">
					<p>
						The <PlaceName>Editor</PlaceName> button in the rail opens a panel
						titled <PlaceName>Edit catalogue</PlaceName>, with four tabs. On a
						wide screen it opens beside your catalogue, which shrinks to make
						room. On a narrower one it opens over the top.
					</p>
				</ManualText>
				<ManualTable
					caption="The four tabs of the editor panel"
					columns={["Tab", "What is in it"]}
					rows={[
						[
							<TabName key="t">General</TabName>,
							"The catalogue name, the opt-in search bar, your logo, contact details, how the page appears in search results, and your own analytics tags.",
						],
						[
							<TabName key="t">Header</TabName>,
							"The navbar at the top of your catalogue, whether it floats, the logo size and the icons in it.",
						],
						[
							<TabName key="t">Footer</TabName>,
							"The footer, your business details, social media links and partners.",
						],
						[
							<TabName key="t">Appearance</TabName>,
							"Themes, custom colours, the background, fonts and corners, and the glass effect.",
						],
					]}
				/>
				<Note kind="info" title="The name is shown but cannot be changed">
					<p>
						The <PlaceName>General</PlaceName> tab shows your catalogue name
						greyed out. It is there for reference. Your web address is fixed
						when you create the catalogue.
					</p>
				</Note>
			</ManualSection>

			<ManualSection kind="risk" title="There is no undo">
				<ManualText>
					<p>
						Deleting a section or an item, swapping a template, and choosing{" "}
						<ButtonName>Leave</ButtonName> on the unsaved changes dialog cannot
						be undone. There is no undo button and no history.
					</p>
					<p>
						The one way back is to reload the builder, which returns you to your
						last <strong>saved</strong> draft. So save before you try something
						you are unsure about. The only true undo anywhere is{" "}
						<ButtonName variant="secondary">Reject</ButtonName> on a Quick AI
						change, and only until you make a change by hand.
					</p>
				</ManualText>
			</ManualSection>

			<ManualSection kind="rules" title="Good to know">
				<Rules>
					<Rule>
						Deleting a section or an item asks you to confirm in your
						browser&apos;s own small dialog, not a Quicktalog one.
					</Rule>
					<Rule>
						<KeyName>Esc</KeyName> closes the editor panel.
					</Rule>
					<Rule>
						There is no drag and drop. Reordering is done from the menu on a
						section or an item.
					</Rule>
					<Rule>
						Opening a content dialog closes the editor panel, so the two never
						overlap.
					</Rule>
					<Rule>
						With the same catalogue open in two tabs, whichever you save last
						wins, silently. Work in one tab.
					</Rule>
					<Rule>
						An active catalogue has no <ButtonName>Continue Editing</ButtonName>{" "}
						button on its dashboard card. Reach the builder through{" "}
						<PlaceName>Edit</PlaceName> in the card&apos;s actions menu.
					</Rule>
				</Rules>
			</ManualSection>

			<ManualSection kind="fix" title="Messages">
				<Messages
					messages={[
						{
							text: "Failed to save the draft",
							cause: "Quicktalog could not reach the place drafts are kept.",
							fix: "Try Save again. Keep the tab open until it succeeds.",
						},
						{
							text: "Failed to save catalogue",
							cause: "The save was refused and no clearer reason came back.",
							fix: "Try again. If it keeps failing, check whether your catalogue is over a plan limit.",
						},
						{
							text: "Please save the catalogue first",
							cause:
								"Publishing was attempted before the catalogue had been saved once.",
							fix: "Select Save, then publish.",
						},
						{
							text: "Catalogue has no name/slug",
							cause: "Preview could not work out the address to open.",
							fix: "Reload the builder from the dashboard.",
						},
					]}
				/>
			</ManualSection>
		</>
	);
}

const page: ManualPage = { Body, meta };
export default page;
