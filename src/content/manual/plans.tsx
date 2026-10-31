import { PlaceName, TabName } from "@/components/manual/Inline";
import { ManualSection } from "@/components/manual/ManualSection";
import { ManualTable } from "@/components/manual/ManualTable";
import { ManualText } from "@/components/manual/ManualText";
import { Note } from "@/components/manual/Note";
import { Rule, Rules } from "@/components/manual/Rules";
import { Term } from "@/components/manual/Term";
import { SubscriptionScreen } from "@/components/manual/screens/SubscriptionScreen";
import type { ManualPage } from "./_types";

const meta = {
	slug: "plans",
	group: "account",
	title: "Plans and what each includes",
	inShort:
		"Compare the five plans, and see which limit you are likely to meet first.",
	result: "You know what your plan allows and what the next one up would add.",
	where: ["Dashboard", "Subscription"],
	keywords: [
		"plans",
		"pricing",
		"starter",
		"basic",
		"pro",
		"growth",
		"premium",
		"limits",
	],
	synonyms: [
		"tiers",
		"subscription",
		"free plan",
		"how much",
		"what do i get",
		"compare",
	],
	related: ["billing", "limits", "ai-credits"],
} satisfies ManualPage["meta"];

function Body() {
	return (
		<>
			<ManualSection kind="info" title="Where you start">
				<ManualText>
					<p>
						Every new account is on <strong>Starter</strong>, which is free and
						does not expire. You can build and publish one catalogue on it, with
						no card needed.
					</p>
					<p>
						Current prices are on the Quicktalog pricing page, which reads them
						from the payment provider, so this manual does not repeat them. Your
						own plan and what it costs you are in the{" "}
						<TabName>Subscription</TabName> tab of your dashboard.
					</p>
				</ManualText>
			</ManualSection>

			<ManualSection kind="opts" title="How much you can build">
				<SubscriptionScreen />

				<ManualTable
					caption="What each plan allows"
					columns={["", "Starter", "Basic", "Pro", "Growth", "Premium"]}
					rows={[
						["Catalogues", "1", "1", "6", "20", "50"],
						["Sections per catalogue", "5", "8", "15", "30", "50"],
						["Items per catalogue", "15", "30", "100", "200", "300"],
						[
							"Page views per 30 days",
							"500",
							"2,000",
							"5,000",
							"15,000",
							"40,000",
						],
						["AI credits per 30 days", "15", "50", "150", "300", "600"],
					]}
				/>
				<Note kind="info" title="Nothing is unlimited">
					<p>Every plan has a number against every limit, Premium included.</p>
				</Note>
			</ManualSection>

			<ManualSection kind="opts" title="What you can switch on">
				<ManualTable
					caption="Which features come with which plan"
					columns={["Feature", "From"]}
					rows={[
						["All seven themes, item layouts and the search bar", "Starter"],
						["Divider sections", "Basic"],
						["Your own navbar, footer, logo and contact details", "Basic"],
						["Your own colours, fonts, corners and shadow", "Pro"],
						["Background photo, gradient or colour", "Pro"],
						["Glass effect and the emoji overlay", "Pro"],
						["External content sections, such as maps and videos", "Pro"],
						["Custom visual sections, built from your own code", "Pro"],
						["Newsletter sign-up in your footer", "Growth"],
						["Your own Google and Meta analytics tags", "Growth"],
						["Features built specially for you", "Premium"],
					]}
				/>
			</ManualSection>

			<ManualSection kind="info" title="Which limit you will meet first">
				<ManualText className="mb-4">
					<p>
						In practice people run into these in a particular order, so it is
						worth knowing which one is really pushing you up a plan.
					</p>
				</ManualText>
				<ManualTable
					caption="The limits in the order people usually meet them"
					columns={["Limit", "What it feels like"]}
					rows={[
						[
							<Term key="t" name="section" />,
							"You cannot add another section. Remember a divider or a block of text counts just as much as a group of items.",
						],
						[
							"Items",
							"You cannot add another item. Items count across the whole catalogue, not per section.",
						],
						[
							"Catalogues",
							"The round + button opens an upgrade dialog instead of the create dialog. Starter and Basic both allow only one, so a second catalogue means Pro.",
						],
						[
							<Term key="t" name="traffic limit" />,
							"Your catalogues are switched off until your 30-day period turns over, then go back online by themselves. Your own visits and previews count towards it.",
						],
						[
							<Term key="t" name="AI credits" />,
							"Quick AI stops accepting changes. A change costs 2 credits, so Starter's 15 is about seven changes.",
						],
					]}
				/>
			</ManualSection>

			<ManualSection kind="rules" title="Good to know">
				<Rules>
					<Rule>
						Starter and Basic both allow exactly one catalogue, so if you need a
						second one the upgrade dialog offers you Pro.
					</Rule>
					<Rule>
						All five plans get the same analytics page with the same 7, 30 and
						90 day ranges. The <PlaceName>Analytics</PlaceName> row on the
						pricing page says <PlaceName>Basic</PlaceName> or{" "}
						<PlaceName>Advanced</PlaceName>, but today both show the same thing.
					</Rule>
					<Rule>
						Going past your limits never deletes sections or items. The
						catalogue simply cannot be published or added to until it fits.
					</Rule>
					<Rule>
						Having more catalogues than a new plan allows is the one exception.
						Then you are asked to delete some before you can use the dashboard.
					</Rule>
					<Rule>
						Your usage against each limit is in the <TabName>Usage</TabName>{" "}
						tab, which also warns you when you pass four fifths of your traffic.
					</Rule>
				</Rules>
			</ManualSection>
		</>
	);
}

const page: ManualPage = { Body, meta };
export default page;
