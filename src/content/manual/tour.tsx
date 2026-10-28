import { ButtonName, PlaceName } from "@/components/manual/Inline";
import { ManualSection } from "@/components/manual/ManualSection";
import { ManualTable } from "@/components/manual/ManualTable";
import { ManualText } from "@/components/manual/ManualText";
import { Note } from "@/components/manual/Note";
import { Rule, Rules } from "@/components/manual/Rules";
import { BuilderScreen } from "@/components/manual/screens/BuilderScreen";
import { DashboardScreen } from "@/components/manual/screens/DashboardScreen";
import { PublishedScreen } from "@/components/manual/screens/PublishedScreen";
import type { ManualPage } from "./_types";

const meta = {
	slug: "tour",
	group: "get-started",
	title: "Quicktalog at a glance",
	inShort: "Meet the three screens you will spend all your time in.",
	result: "You can tell where you are and where to go next.",
	keywords: [
		"tour",
		"overview",
		"dashboard",
		"builder",
		"published",
		"screens",
	],
	synonyms: ["walkthrough", "introduction", "what are the screens", "layout"],
	related: ["dashboard", "builder-basics", "quickstart"],
} satisfies ManualPage["meta"];

function Body() {
	return (
		<>
			<ManualSection kind="info" title="Three screens, three jobs">
				<ManualText>
					<p>
						Quicktalog is smaller than it looks. There is a dashboard where you
						keep your catalogues, a builder where you change one of them, and
						the published page your customers open. Almost everything else is a
						panel or a dialog inside one of those three.
					</p>
				</ManualText>
			</ManualSection>

			<ManualSection kind="screen" title="1. The dashboard">
				<ManualText className="mb-4">
					<p>
						Where you land after signing in. Your profile and totals at the top,
						a card for every catalogue below, and your plan, usage, settings and
						support in the tabs on the left.
					</p>
				</ManualText>
				<DashboardScreen />
			</ManualSection>

			<ManualSection kind="screen" title="2. The builder">
				<ManualText className="mb-4">
					<p>
						Where you change one catalogue. It shows the real thing with editing
						controls on top, so what you see is close to what your customers
						will get. The tool rail is on the right, and Quick AI is the
						floating button in the bottom left.
					</p>
				</ManualText>
				<BuilderScreen />
				<Note kind="warn" title="The builder edits a private draft">
					<p>
						Nothing you do here reaches your customers until you select{" "}
						<ButtonName>Publish</ButtonName>.{" "}
						<ButtonName variant="secondary">Save</ButtonName> only keeps your
						work for you.
					</p>
				</Note>
			</ManualSection>

			<ManualSection kind="screen" title="3. The published catalogue">
				<ManualText className="mb-4">
					<p>
						What your customers see, at your own web address. Most of them will
						be on a phone. They can fold sections away, tap an item for a larger
						view, and search if you have switched the search bar on.
					</p>
				</ManualText>
				<PublishedScreen />
			</ManualSection>

			<ManualSection kind="opts" title="Getting between them">
				<ManualTable
					caption="How to move between the three screens"
					columns={["From", "To", "How"]}
					rows={[
						[
							"Dashboard",
							"Builder",
							<>
								<ButtonName>Continue Editing</ButtonName> on a draft card, or{" "}
								<PlaceName>Edit</PlaceName> in the card&apos;s actions menu.
							</>,
						],
						[
							"Dashboard",
							"Published catalogue",
							<>
								<ButtonName>View Catalogue</ButtonName> on an active card.
							</>,
						],
						[
							"Builder",
							"Published catalogue",
							<>
								<ButtonName>Publish</ButtonName>, then the link in the dialog.
							</>,
						],
						[
							"Builder",
							"A private preview",
							<>
								<ButtonName variant="secondary">Preview</ButtonName> in the
								rail. It saves first.
							</>,
						],
						[
							"Builder",
							"Dashboard",
							<>
								<PlaceName>Dashboard</PlaceName> at the bottom of the rail.
							</>,
						],
					]}
				/>
			</ManualSection>

			<ManualSection kind="rules" title="Good to know">
				<Rules>
					<Rule>
						There is no page at <code>/admin</code> on its own. Your dashboard
						is at <code>/admin/dashboard</code>.
					</Rule>
					<Rule>
						An active catalogue has no <ButtonName>Continue Editing</ButtonName>{" "}
						button. Use <PlaceName>Edit</PlaceName> in the actions menu.
					</Rule>
					<Rule>
						The builder and the dashboard are only for you. Nobody else can open
						them, even with the link.
					</Rule>
					<Rule>
						The preview address works for you alone. Sending it to someone else
						sends them to the sign in page.
					</Rule>
				</Rules>
			</ManualSection>
		</>
	);
}

const page: ManualPage = { Body, meta };
export default page;
