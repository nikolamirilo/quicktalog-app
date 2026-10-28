import { ButtonName, PlaceName } from "@/components/manual/Inline";
import { ManualSection } from "@/components/manual/ManualSection";
import { ManualTable } from "@/components/manual/ManualTable";
import { ManualText } from "@/components/manual/ManualText";
import { Messages } from "@/components/manual/Messages";
import { Note } from "@/components/manual/Note";
import { Rule, Rules } from "@/components/manual/Rules";
import { Step, Steps } from "@/components/manual/Steps";
import { PublishSuccessScreen } from "@/components/manual/screens/PublishSuccessScreen";
import type { ManualPage } from "./_types";

const meta = {
	slug: "publish",
	group: "share",
	title: "Publish your catalogue",
	inShort: "Put your draft on your public link, and take it off again.",
	result: "A live catalogue anyone with the link can open.",
	where: ["Builder", "Publish"],
	before: [
		{
			text: "Your catalogue has a heading and at least one section.",
			href: "sections",
		},
	],
	keywords: [
		"publish",
		"update",
		"live",
		"activate",
		"deactivate",
		"unpublish",
		"status",
	],
	synonyms: [
		"go live",
		"make public",
		"take offline",
		"switch off",
		"turn off",
	],
	related: ["share-link", "builder-basics", "manage-catalogues"],
} satisfies ManualPage["meta"];

function Body() {
	return (
		<>
			<ManualSection kind="steps" title="Publish from the builder">
				<Steps>
					<Step
						title={
							<>
								Check that <ButtonName>Publish</ButtonName> is available
							</>
						}
					>
						<p>
							It stays switched off until your catalogue has a heading and at
							least one section. A brand new catalogue shows a{" "}
							<PlaceName>+ Add Heading</PlaceName> placeholder, which does not
							count.
						</p>
					</Step>
					<Step
						done='A toast reads "Catalogue published successfully" and a Congratulations dialog opens.'
						title={
							<>
								Select <ButtonName>Publish</ButtonName> in the rail
							</>
						}
					>
						<p>
							There is no confirmation step. It goes live as soon as you select
							it.
						</p>
					</Step>
					<Step title="Copy your link from the dialog">
						<p>
							The dialog has a <PlaceName>Direct link</PlaceName> field with a{" "}
							<ButtonName variant="secondary">Copy</ButtonName> button, a QR
							code, and a <PlaceName>Embed on your website</PlaceName> option
							that downloads a ready made HTML file.
						</p>
					</Step>
				</Steps>
				<PublishSuccessScreen />

				<Note kind="info" title="After the first time the button says Update">
					<p>
						For a catalogue that is already live, the same control reads{" "}
						<ButtonName>Update</ButtonName>. You get a toast with a{" "}
						<ButtonName variant="secondary">View</ButtonName> link instead of
						the dialog.
					</p>
				</Note>
			</ManualSection>

			<ManualSection kind="info" title="What publishing actually does">
				<ManualText>
					<p>
						Publishing copies your draft onto the public page and sets the
						catalogue to <PlaceName>Active</PlaceName>. Your customers see the
						change straight away. You do not have to clear anything or wait.
					</p>
					<p>
						It publishes what is in front of you in the builder, including any
						Quick AI changes you have not accepted yet. It does not publish work
						from another tab that you have not saved.
					</p>
				</ManualText>
				<Note kind="warn" title="Publishing is checked against your plan">
					<p>
						A catalogue with more sections or items than your plan allows cannot
						be published, and neither can one belonging to an account that has
						gone over its traffic limit for the month. The reason appears in the
						toast.
					</p>
				</Note>
			</ManualSection>

			<ManualSection kind="steps" title="Publish from the dashboard">
				<ManualText className="mb-4">
					<p>
						You do not have to open the builder. A draft or inactive catalogue
						card has a{" "}
						<ButtonName variant="secondary">Publish Catalogue</ButtonName>{" "}
						button.
					</p>
				</ManualText>
				<Steps>
					<Step
						done='A toast reads "Catalogue published successfully" with a View link.'
						title={
							<>
								Select{" "}
								<ButtonName variant="secondary">Publish Catalogue</ButtonName>{" "}
								on the card
							</>
						}
					>
						<p>
							If something is missing, the toast says what, and offers{" "}
							<ButtonName variant="secondary">Open Builder</ButtonName>.
						</p>
					</Step>
				</Steps>
			</ManualSection>

			<ManualSection kind="steps" title="Take a catalogue off the web">
				<ManualText className="mb-4">
					<p>
						There is no button called Unpublish. You change the status instead.
					</p>
				</ManualText>
				<Steps>
					<Step title="Open the catalogue card's actions menu on the dashboard">
						<p>The three dots beside the name.</p>
					</Step>
					<Step
						done="The status pill changes to Inactive."
						title={
							<>
								Choose <PlaceName>Change Status</PlaceName>, then{" "}
								<PlaceName>Deactivate</PlaceName>
							</>
						}
					>
						<p>
							The same submenu also offers <PlaceName>Save</PlaceName>, which
							puts the catalogue back to <PlaceName>Draft</PlaceName>. Both take
							it off the web.
						</p>
					</Step>
				</Steps>
				<Note
					kind="warn"
					title="The link keeps working, but shows nothing useful"
				>
					<p>
						Your address stays the same and stays reachable. Anyone opening it
						sees a dialog headed <PlaceName>Catalogue Not Found</PlaceName> with
						an invitation to try Quicktalog. If you have printed that link or a
						QR code, people will reach this page, so switch the catalogue back
						on rather than leaving it off for long.
					</p>
				</Note>
			</ManualSection>

			<ManualSection kind="opts" title="The five statuses">
				<ManualTable
					caption="What each catalogue status means"
					columns={["Status", "Can customers open it?", "How you get there"]}
					rows={[
						[
							"Draft",
							"No.",
							"Where every new catalogue starts, or Change Status then Save.",
						],
						["Active", "Yes.", "Publish, or Change Status then Activate."],
						[
							"Inactive",
							"No. They see Catalogue Not Found.",
							"Change Status then Deactivate, or a plan downgrade.",
						],
						[
							"In preparation",
							"No. It clears by itself.",
							"Set while Quicktalog finishes setting the catalogue up.",
						],
						["Error", "No.", "Something went wrong during setup."],
					]}
				/>
			</ManualSection>

			<ManualSection kind="rules" title="Good to know">
				<Rules>
					<Rule>
						There is no confirmation before publishing, and no scheduling. It
						happens immediately.
					</Rule>
					<Rule>
						Use <ButtonName variant="secondary">Preview</ButtonName> first if
						you want to see your draft as a customer would. It saves and opens a
						private address.
					</Rule>
					<Rule>
						The QR code in the Congratulations dialog is always the standard
						design, not the one you may have made in the QR editor.
					</Rule>
					<Rule>
						<PlaceName>Activate</PlaceName> is greyed out with the tooltip{" "}
						<q>Traffic limit reached</q> when your catalogues have been opened
						more times this month than your plan allows.
					</Rule>
					<Rule>
						Dropping to a smaller plan can switch catalogues off for you,
						without you doing anything.
					</Rule>
					<Rule>
						<PlaceName>Embed</PlaceName> downloads a complete HTML file holding
						a full screen frame, not a snippet to paste into an existing page.
					</Rule>
				</Rules>
			</ManualSection>

			<ManualSection kind="fix" title="Messages">
				<Messages
					messages={[
						{
							text: "Cannot publish: missing heading.",
							cause: "Your catalogue has no heading yet.",
							fix: "Select Open Builder, then select the + Add Heading placeholder at the top and type one.",
						},
						{
							text: "Cannot publish: missing content.",
							cause: "Your catalogue has no sections.",
							fix: "Add at least one section, then publish.",
						},
						{
							text: "Cannot publish: missing heading and content.",
							cause: "The catalogue is still empty.",
							fix: "Add a heading and one section.",
						},
						{
							text: "This month's traffic limit for your plan is reached",
							cause:
								"Your catalogues have been opened more times this month than your plan allows.",
							fix: "Wait for the next month, or move to a bigger plan to switch them back on.",
						},
						{
							text: "Could not retrieve catalogue data. Please try again.",
							cause:
								"Quicktalog could not read the catalogue before publishing it.",
							fix: "Reload the dashboard and try again.",
						},
						{
							text: "Failed to publish catalogue",
							cause: "The publish was refused and no clearer reason came back.",
							fix: "Check your plan limits, then try again.",
						},
						{
							text: "Could not activate this catalogue.",
							cause: "Switching the catalogue back on was refused.",
							fix: "Usually the traffic limit. Check the Usage tab on your dashboard.",
						},
					]}
				/>
			</ManualSection>
		</>
	);
}

const page: ManualPage = { Body, meta };
export default page;
