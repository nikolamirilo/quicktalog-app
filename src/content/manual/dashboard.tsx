import { ButtonName, PlaceName, TabName } from "@/components/manual/Inline";
import { ManualSection } from "@/components/manual/ManualSection";
import { ManualTable } from "@/components/manual/ManualTable";
import { ManualText } from "@/components/manual/ManualText";
import { Messages } from "@/components/manual/Messages";
import { Note } from "@/components/manual/Note";
import { Rule, Rules } from "@/components/manual/Rules";
import { Point } from "@/components/manual/Screen";
import { ScreenProvider } from "@/components/manual/Screen";
import { DashboardScreen } from "@/components/manual/screens/DashboardScreen";
import { Term } from "@/components/manual/Term";
import type { ManualPage } from "./_types";

const meta = {
	slug: "dashboard",
	group: "catalogues",
	title: "Find your way around the dashboard",
	inShort:
		"Learn what each part of the dashboard shows you, and where to go next.",
	result: "You know where your catalogues, your numbers and your plan live.",
	where: ["Sign in", "Dashboard"],
	keywords: ["dashboard", "overview", "tabs", "stat cards", "catalogue cards"],
	synonyms: ["home", "my account", "admin", "control panel", "my catalogues"],
	related: ["create-catalogue", "manage-catalogues"],
} satisfies ManualPage["meta"];

function Body() {
	return (
		<>
			<ScreenProvider>
				<ManualSection kind="info" title="What you are looking at">
					<ManualText className="mb-4">
						<p>
							The dashboard is where everything starts. The tabs on the left{" "}
							<Point n={1} /> switch what the big panel shows. The overview tab
							opens first, with your totals <Point n={2} /> and a card for each{" "}
							<Term name="catalogue" /> <Point n={3} />. The round button in the
							bottom right <Point n={5} /> creates a new one.
						</p>
					</ManualText>
					<DashboardScreen />
				</ManualSection>
			</ScreenProvider>

			<ManualSection kind="opts" title="The five tabs">
				<ManualTable
					caption="The dashboard tabs and what each one is for"
					columns={["Tab", "What it is for"]}
					rows={[
						[
							<TabName key="t">Overview</TabName>,
							"Your profile, your totals, every catalogue, and the people who signed up to your newsletter.",
						],
						[
							<TabName key="t">Subscription</TabName>,
							"The plan you are on, what it costs and when it renews.",
						],
						[
							<TabName key="t">Usage</TabName>,
							"How much of your plan you have used this 30-day period, including traffic and AI credits.",
						],
						[
							<TabName key="t">Settings</TabName>,
							"Your name, your email address, your password, cookies, your signed-in devices, and deleting your account.",
						],
						[
							<TabName key="t">Support</TabName>,
							"How to reach us when something is wrong.",
						],
					]}
				/>
				<Note kind="info" title="Switching tabs does not reload the page">
					<p>
						The web address changes as you move between tabs, so you can
						bookmark one or send it to yourself. An address with a tab name the
						product does not know opens <TabName>Overview</TabName>.
					</p>
				</Note>
			</ManualSection>

			<ManualSection kind="opts" title="The four totals">
				<ManualText className="mb-4">
					<p>
						These four numbers cover all of your catalogues together, for as
						long as you have had an account.
					</p>
				</ManualText>
				<ManualTable
					caption="What each total on the overview counts"
					columns={["Total", "What it counts"]}
					rows={[
						[
							<PlaceName key="t">Total Views</PlaceName>,
							"Every time one of your catalogue pages was opened.",
						],
						[
							<PlaceName key="t">Total Visitors</PlaceName>,
							"How many people opened them. One person counts once a day, however often they come back that day.",
						],
						[
							<PlaceName key="t">Catalogues</PlaceName>,
							"How many catalogues you have created, whatever their status.",
						],
						[
							<PlaceName key="t">Newsletter</PlaceName>,
							"How many people have signed up through your catalogues.",
						],
					]}
				/>
				<ManualText className="mt-3">
					<p>
						Each card has a small <strong>i</strong> button that opens the same
						explanation inside the product.
					</p>
				</ManualText>
				<Note kind="warn" title="These totals lag behind the analytics page">
					<p>
						They are built once a day, early in the morning UTC, so they can be
						lower than the numbers on a catalogue&apos;s own analytics page,
						which are read live. Trust the analytics page for anything recent.
					</p>
				</Note>
			</ManualSection>

			<ManualSection kind="opts" title="A catalogue card">
				<ManualText className="mb-4">
					<p>
						Every catalogue gets a card with its name, its status, when it was
						last changed, and two buttons. The buttons depend on the status.
					</p>
				</ManualText>
				<ManualTable
					caption="Catalogue statuses and the buttons each one shows"
					columns={["Status", "What it means", "Buttons on the card"]}
					rows={[
						[
							"Active",
							"Published and switched on. Anyone with the link can open it.",
							<>
								<ButtonName>View Catalogue</ButtonName> and{" "}
								<ButtonName variant="secondary">Analytics</ButtonName>
							</>,
						],
						[
							"Draft",
							"Not published yet. Only you can see it.",
							<>
								<ButtonName>Continue Editing</ButtonName> and{" "}
								<ButtonName variant="secondary">Publish Catalogue</ButtonName>
							</>,
						],
						[
							"Inactive",
							"Published once, then switched off. The link shows a Not found page.",
							<>
								<ButtonName>Continue Editing</ButtonName> and{" "}
								<ButtonName variant="secondary">Publish Catalogue</ButtonName>
							</>,
						],
						[
							"In preparation",
							"Being set up. This clears on its own.",
							"A spinner. Everything except deleting is switched off.",
						],
						[
							"Error",
							"Setting it up failed.",
							"A red line asking you to delete the catalogue and start again.",
						],
					]}
				/>
			</ManualSection>

			<ManualSection kind="rules" title="Good to know">
				<Rules>
					<Rule>
						The grid shows eight catalogues at first. A{" "}
						<ButtonName variant="secondary">Show More</ButtonName> button
						reveals the rest.
					</Rule>
					<Rule>
						Cards are grouped by status, then by the most recently changed.
					</Rule>
					<Rule>
						The <ButtonName variant="secondary">Analytics</ButtonName> button
						only appears on active catalogues. You can still reach the numbers
						for the others from the catalogue picker on the analytics page.
					</Rule>
					<Rule>
						Your totals refresh by themselves every five minutes while the
						overview is open.
					</Rule>
					<Rule>
						The first time you open the dashboard, Quicktalog asks how you heard
						about it. The question has no close button, and{" "}
						<ButtonName variant="secondary">Skip</ButtonName> counts as an
						answer, so you are only asked once.
					</Rule>
				</Rules>
			</ManualSection>

			<ManualSection kind="fix" title="Messages">
				<Messages
					messages={[
						{
							text: "We couldn't load your dashboard. Please try again.",
							cause:
								"Your catalogues or your totals could not be read, usually a dropped connection.",
							fix: (
								<>
									Select <ButtonName variant="secondary">Try again</ButtonName>.
									If it keeps happening, reload the page.
								</>
							),
						},
						{
							text: "Something went wrong. Please try again later.",
							cause: "Your account details themselves could not be read.",
							fix: "Reload the page. If it continues, sign out and sign back in.",
						},
						{
							text: "We couldn't load your newsletter subscribers.",
							cause:
								"Only the newsletter table failed. The rest of the page is fine.",
							fix: "Reload the page.",
						},
						{
							text: "You've reached your current catalogue limit",
							cause: "You have as many catalogues as your plan allows.",
							fix: "Delete one you no longer need, or move to a bigger plan.",
						},
						{
							text: "You've reached your traffic limit",
							cause:
								"Your catalogues were opened more times this period than your plan allows.",
							fix: "Wait for your next 30-day period to start, or move to a bigger plan to switch them back on.",
						},
					]}
				/>
			</ManualSection>
		</>
	);
}

const page: ManualPage = { Body, meta };
export default page;
