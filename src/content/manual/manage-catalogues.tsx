import { ButtonName, PlaceName } from "@/components/manual/Inline";
import { ManualSection } from "@/components/manual/ManualSection";
import { ManualTable } from "@/components/manual/ManualTable";
import { ManualText } from "@/components/manual/ManualText";
import { Messages } from "@/components/manual/Messages";
import { Note } from "@/components/manual/Note";
import { Rule, Rules } from "@/components/manual/Rules";
import { Step, Steps } from "@/components/manual/Steps";
import { ActionsMenuScreen } from "@/components/manual/screens/ActionsMenuScreen";
import type { ManualPage } from "./_types";

const meta = {
	slug: "manage-catalogues",
	group: "catalogues",
	title: "Duplicate, switch off or delete a catalogue",
	inShort:
		"Use the actions menu on a catalogue card, and know which of them cannot be undone.",
	result:
		"Your list of catalogues holds only what you want, in the state you want it.",
	where: ["Dashboard", "A catalogue card", "The three dots"],
	before: [
		{ text: "You have at least one catalogue.", href: "create-catalogue" },
	],
	keywords: [
		"duplicate",
		"delete",
		"deactivate",
		"rename",
		"copy",
		"status",
		"embed",
	],
	synonyms: [
		"rename catalogue",
		"change url",
		"remove",
		"archive",
		"clone",
		"copy catalogue",
	],
	related: ["dashboard", "publish", "plans"],
} satisfies ManualPage["meta"];

function Body() {
	return (
		<>
			<ManualSection kind="info" title="The actions menu">
				<ManualText className="mb-4">
					<p>
						Every catalogue card on the dashboard has a three dot button beside
						its name. Everything on this page starts there.
					</p>
				</ManualText>
				<ActionsMenuScreen />

				<ManualTable
					caption="Everything in the catalogue actions menu"
					columns={["Menu item", "What it does"]}
					rows={[
						[
							<PlaceName key="t">Edit</PlaceName>,
							"Opens the catalogue in the builder. For an active catalogue this is the only way in.",
						],
						[
							<PlaceName key="t">Change Status</PlaceName>,
							"Switches the catalogue on or off, or puts it back to a draft.",
						],
						[
							<PlaceName key="t">Share</PlaceName>,
							"Copies the public link. The item then reads Link Copied.",
						],
						[<PlaceName key="t">QR Code</PlaceName>, "Opens the QR editor."],
						[
							<PlaceName key="t">Embed</PlaceName>,
							"Downloads a complete HTML file with your catalogue in a full screen frame.",
						],
						[
							<PlaceName key="t">Duplicate</PlaceName>,
							"Makes a copy under a new name, as a draft.",
						],
						[
							<PlaceName key="t">Delete</PlaceName>,
							"Removes the catalogue for good.",
						],
					]}
				/>
				<Note
					kind="info"
					title="A catalogue still being set up is mostly locked"
				>
					<p>
						While a catalogue shows <PlaceName>In preparation</PlaceName> or{" "}
						<PlaceName>Error</PlaceName>, everything except{" "}
						<PlaceName>Delete</PlaceName> is greyed out, and deleting waits
						until 10 minutes after it was created.
					</p>
				</Note>
			</ManualSection>

			<ManualSection kind="steps" title="Duplicate a catalogue">
				<ManualText className="mb-4">
					<p>
						A copy is the nearest thing to renaming, and a safe way to try a big
						change.
					</p>
				</ManualText>
				<Steps>
					<Step
						title={
							<>
								Choose <PlaceName>Duplicate</PlaceName>
							</>
						}
					/>
					<Step
						done="A green line reads &quot;Great! This name is available.&quot;"
						title="Type a name for the copy"
					>
						<p>
							Up to 60 characters, letters, numbers and spaces. The dialog shows
							the address the copy will get.
						</p>
					</Step>
					<Step
						done="A toast confirms the new catalogue and it appears in your list as a draft."
						title={
							<>
								Select <ButtonName>Confirm</ButtonName>
							</>
						}
					/>
				</Steps>
				<Note kind="info" title="How to change a catalogue's address">
					<p>
						There is no rename. Duplicate the catalogue under the name you want,
						check the copy, publish it, then delete the original. Remember that
						any QR code or link you have already given out points at the old
						address.
					</p>
				</Note>
			</ManualSection>

			<ManualSection kind="risk" title="Deleting a catalogue">
				<ManualText>
					<p>
						<PlaceName>Delete</PlaceName> asks you to confirm with the dialog{" "}
						<PlaceName>Delete Catalogue</PlaceName>, which says plainly that it
						cannot be undone. Selecting{" "}
						<ButtonName variant="secondary">Confirm</ButtonName> removes the
						catalogue, its sections, its items and its public page. There is no
						recycle bin and no export.
					</p>
					<p>
						If you only want to take it off the web, use{" "}
						<PlaceName>Change Status</PlaceName> then{" "}
						<PlaceName>Deactivate</PlaceName> instead. You keep everything and
						can switch it back on whenever you like.
					</p>
				</ManualText>
			</ManualSection>

			<ManualSection kind="info" title="If you drop to a smaller plan">
				<ManualText className="mb-4">
					<p>
						When a smaller plan allows fewer catalogues than you have, the
						dashboard opens <PlaceName>Catalogue Limit Exceeded</PlaceName> as
						soon as you arrive. It tells you how many you have, how many you are
						allowed, and how many you must choose to delete.
					</p>
					<p>
						<strong>It has no cancel button and no close button.</strong> You
						cannot reach the rest of your dashboard until you have ticked enough
						catalogues and deleted them, or moved back to a bigger plan.
					</p>
				</ManualText>
				<Note kind="risk" title="Choose carefully">
					<p>
						Those deletions are as permanent as any other. Pick the catalogues
						you genuinely do not need, and check the dates on each card first.
					</p>
				</Note>
			</ManualSection>

			<ManualSection kind="rules" title="Good to know">
				<Rules>
					<Rule>
						<PlaceName>Change Status</PlaceName> lists only the statuses the
						catalogue is not currently in, as <PlaceName>Activate</PlaceName>,{" "}
						<PlaceName>Deactivate</PlaceName> or <PlaceName>Save</PlaceName>.{" "}
						<PlaceName>Save</PlaceName> here means putting it back to a draft.
					</Rule>
					<Rule>
						<PlaceName>Activate</PlaceName> is greyed out with the tooltip{" "}
						<q>Traffic limit reached</q> when you have used up this
						period&apos;s page views.
					</Rule>
					<Rule>
						At your catalogue limit, <PlaceName>Duplicate</PlaceName> opens the
						upgrade dialog rather than the name dialog.
					</Rule>
					<Rule>
						The round <ButtonName>+</ButtonName> button dims when you reach your
						traffic limit, but it still opens, because creating a catalogue only
						counts against the number of catalogues.
					</Rule>
					<Rule>
						Catalogue names are shared across the whole of Quicktalog, so a name
						may be refused even though you have never used it.
					</Rule>
				</Rules>
			</ManualSection>

			<ManualSection kind="fix" title="Messages">
				<Messages
					messages={[
						{
							text: "Are you sure you want to delete this catalogue? This action cannot be undone.",
							cause: "You chose Delete.",
							fix: "Select Confirm to delete it, or Cancel to keep it.",
						},
						{
							text: "Could not duplicate this catalogue. Your plan may not allow another one.",
							cause: "The copy would take you past your catalogue limit.",
							fix: "Select View plans, or delete a catalogue you do not need first.",
						},
						{
							text: "Failed to delete catalogue. Please try again.",
							cause: "The deletion did not go through.",
							fix: "Reload the dashboard and try again.",
						},
						{
							text: "Failed to delete some catalogues. Please try again.",
							cause:
								"A group deletion from the limit dialog failed. Nothing was deleted, because it is all or nothing.",
							fix: "Try again. If it keeps failing, contact support.",
						},
						{
							text: "Failed to update status. Please try again.",
							cause: "Switching the catalogue on or off did not work.",
							fix: "Reload the dashboard. If the catalogue was being switched on, check your traffic usage.",
						},
						{
							text: "Available 10 minutes after creation",
							cause:
								"The tooltip on a greyed out Delete for a catalogue still being set up.",
							fix: "Wait ten minutes from when you created it, then try again.",
						},
					]}
				/>
			</ManualSection>
		</>
	);
}

const page: ManualPage = { Body, meta };
export default page;
