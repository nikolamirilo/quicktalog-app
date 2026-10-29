import { ButtonName, PlaceName, TabName } from "@/components/manual/Inline";
import { ManualSection } from "@/components/manual/ManualSection";
import { ManualTable } from "@/components/manual/ManualTable";
import { ManualText } from "@/components/manual/ManualText";
import { Messages } from "@/components/manual/Messages";
import { Note } from "@/components/manual/Note";
import { Option, Options } from "@/components/manual/Options";
import { Rule, Rules } from "@/components/manual/Rules";
import { Point, ScreenProvider } from "@/components/manual/Screen";
import { AnalyticsScreen } from "@/components/manual/screens/AnalyticsScreen";
import { Term } from "@/components/manual/Term";
import type { ManualPage } from "./_types";

const meta = {
	slug: "analytics",
	group: "insights",
	title: "Read your analytics",
	inShort:
		"See how many people opened one catalogue, and understand what the numbers include.",
	result:
		"You know how your catalogue is doing, and what the figures do not cover.",
	where: ["Dashboard", "A catalogue card", "Analytics"],
	before: [
		{
			text: "The catalogue is published and has had some visitors.",
			href: "publish",
		},
	],
	keywords: [
		"analytics",
		"views",
		"visitors",
		"traffic",
		"chart",
		"busiest day",
	],
	synonyms: [
		"statistics",
		"stats",
		"how many people",
		"visits",
		"reporting",
		"insights",
	],
	related: ["dashboard", "plans", "limits"],
} satisfies ManualPage["meta"];

function Body() {
	return (
		<>
			<ScreenProvider>
				<ManualSection kind="info" title="Opening analytics">
					<ManualText className="mb-4">
						<p>
							Analytics are per catalogue. The{" "}
							<ButtonName variant="secondary">Analytics</ButtonName> button
							appears on the dashboard card of an active catalogue. Once you are
							on the page, the picker at the top <Point n={1} /> reaches every
							catalogue you own, whatever its status.
						</p>
						<p>
							The four cards <Point n={3} /> are the headline figures, the chart{" "}
							<Point n={5} /> shows the shape of your traffic, and the table{" "}
							<Point n={6} /> gives you the last ten days as numbers.
						</p>
					</ManualText>
					<AnalyticsScreen />
				</ManualSection>
			</ScreenProvider>

			<ManualSection kind="opts" title="What each number means">
				<Options>
					<Option name="Total views">
						<p>
							Every time one of your catalogue pages was opened in the period. A
							single person opening it five times counts five times.
						</p>
					</Option>
					<Option name="Unique visitors">
						<p>
							How many people opened it. Each person counts once a day, however
							often they come back that day.
						</p>
					</Option>
					<Option name="Most popular day">
						<p>
							The single busiest date in the period, with the number of views
							underneath. It shows a dash when there were no views at all.
						</p>
					</Option>
					<Option name="Avg. views / day">
						<p>
							Total views divided by the whole length of the period, so a
							catalogue published halfway through a 30 day window still divides
							by 30 and looks quieter than it is.
						</p>
					</Option>
				</Options>
			</ManualSection>

			<ManualSection kind="opts" title="The date range">
				<Options>
					<Option
						defaultValue="30 days"
						name="Date range"
						values={["7 days", "30 days", "90 days"]}
					>
						<p>
							How far back to look. Every plan gets all three. The comparison
							underneath each number is against the period of the same length
							immediately before, so 30 days is compared with the 30 days before
							that.
						</p>
					</Option>
				</Options>
				<Note kind="info" title="When there is nothing to compare with">
					<p>
						If the earlier period had no traffic, the line reads{" "}
						<q>No views in the previous 30 days</q> rather than a misleading
						percentage. When both periods are empty it reads{" "}
						<q>No change vs previous 30 days</q>.
					</p>
				</Note>
			</ManualSection>

			<ManualSection kind="rules" title="What the numbers include">
				<Rules>
					<Rule>
						<strong>Your own visits count.</strong> Opening your own catalogue
						to check it adds a view.
					</Rule>
					<Rule>
						Days are counted in UTC, not your local time. A visit late in the
						evening in Europe can land on the next day.
					</Rule>
					<Rule>
						Visits to the private preview address do not appear here, but they
						do count towards your <Term name="traffic limit" />.
					</Rule>
					<Rule>
						There is no breakdown by item, country, device or where people came
						from. Views and visitors over time is what Quicktalog records.
					</Rule>
					<Rule>
						Scans of a QR code are not counted separately. They arrive as
						ordinary visits.
					</Rule>
					<Rule>
						The <PlaceName>Busiest</PlaceName> badge in the table marks the
						busiest day of the whole period, so on a 30 or 90 day range it is
						often not among the ten days shown.
					</Rule>
				</Rules>
				<Note
					kind="warn"
					title="These figures will not match your own analytics"
				>
					<p>
						If you have added your own Google or Meta tags, their numbers will
						be lower, because Quicktalog deliberately leaves signed in browsers
						and previews out of those tags while still counting them here.
					</p>
				</Note>
			</ManualSection>

			<ManualSection kind="info" title="Three places, three numbers">
				<ManualTable
					caption="Why the figures differ between screens"
					columns={["Where", "What it shows", "How fresh"]}
					rows={[
						[
							"This page",
							"One catalogue, over 7, 30 or 90 days.",
							"Read live each time you open it.",
						],
						[
							<>
								Dashboard <TabName>Overview</TabName> totals
							</>,
							"All catalogues together, all time.",
							"Built once a day, early in the morning UTC, so it lags and can read lower.",
						],
						[
							<>
								Dashboard <TabName>Usage</TabName> traffic meter
							</>,
							"All catalogues together, this 30-day period, against your plan.",
							"From the same daily figures as the totals.",
						],
					]}
				/>
				<Note kind="info" title="Trust this page for anything recent">
					<p>
						When the two disagree, the analytics page is the one reading your
						traffic directly.
					</p>
				</Note>
			</ManualSection>

			<ManualSection kind="info" title="The traffic limit">
				<ManualText className="mb-4">
					<p>
						Your plan includes a number of page views per 30 days, counted
						across all your catalogues together. The count resets 30 days after
						the day you signed up, and every 30 days after that, in UTC. The{" "}
						<TabName>Usage</TabName> tab names your next reset date.
					</p>
				</ManualText>
				<ManualTable
					caption="Page views included per 30 days with each plan"
					columns={["Plan", "Page views per 30 days"]}
					rows={[
						["Starter", "500"],
						["Basic", "2,000"],
						["Pro", "5,000"],
						["Growth", "15,000"],
						["Premium", "40,000"],
					]}
				/>
				<ManualText className="mt-3">
					<p>
						The <TabName>Usage</TabName> tab shows a{" "}
						<PlaceName>Traffic</PlaceName> meter that warns you at{" "}
						<PlaceName>Near limit</PlaceName> once you pass four fifths of it,
						and reads <PlaceName>Limit reached</PlaceName> after that. Going
						over can take your catalogues offline until your period turns over
						or you move to a bigger plan.
					</p>
				</ManualText>
			</ManualSection>

			<ManualSection kind="fix" title="Messages">
				<Messages
					messages={[
						{
							text: "Error loading analytics",
							cause: "The figures could not be fetched.",
							fix: "Reload the page. The numbers are read fresh each time, so nothing is lost.",
						},
						{
							text: "Unable to load analytics data at this time. Please try again later.",
							cause: "The line under the error above.",
							fix: "Try again in a few minutes.",
						},
						{
							text: "You've reached your traffic limit",
							cause:
								"Your catalogues were opened more times this period than your plan allows.",
							fix: "Wait for your next 30-day period, or move to a bigger plan to switch your catalogues back on.",
						},
						{
							text: "Traffic limit reached",
							cause:
								"The tooltip on a greyed out Activate option, for the same reason.",
							fix: "Check the Usage tab to see how far over you are.",
						},
					]}
				/>
				<Note kind="info" title="An empty catalogue shows zeros, not a message">
					<p>
						A catalogue nobody has opened shows 0 in every card and a flat
						chart. There is no separate message to say there is no data yet.
					</p>
				</Note>
			</ManualSection>
		</>
	);
}

const page: ManualPage = { Body, meta };
export default page;
