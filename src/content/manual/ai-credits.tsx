import { ButtonName, PlaceName, TabName } from "@/components/manual/Inline";
import { ManualSection } from "@/components/manual/ManualSection";
import { ManualTable } from "@/components/manual/ManualTable";
import { ManualText } from "@/components/manual/ManualText";
import { Messages } from "@/components/manual/Messages";
import { Note } from "@/components/manual/Note";
import { Rule, Rules } from "@/components/manual/Rules";
import { CreditMeterScreen } from "@/components/manual/screens/CreditMeterScreen";
import type { ManualPage } from "./_types";

const meta = {
	slug: "ai-credits",
	group: "assistant",
	title: "AI credits",
	inShort:
		"Understand what an ask to Quick AI costs, how many you get, and when they come back.",
	result: "You can tell how far your credits will go this month.",
	where: ["Builder", "Quick AI", "The ring in the header"],
	keywords: ["credits", "ai credits", "limit", "cost", "monthly", "reset"],
	synonyms: [
		"tokens",
		"quota",
		"allowance",
		"ran out of credits",
		"how much does ai cost",
	],
	related: ["quick-ai", "plans", "limits"],
} satisfies ManualPage["meta"];

function Body() {
	return (
		<>
			<ManualSection kind="info" title="What a credit buys">
				<ManualTable
					caption="What each kind of ask costs in credits"
					columns={["What you do", "Credits"]}
					rows={[
						["Ask a question and change nothing", "Free"],
						["Ask for a change", "2"],
						["Each extra task in the same ask", "1 more"],
						["Each web page Quick AI reads for you", "2 more"],
						["Reading text out of photos you attach", "Free"],
						["Finding photos for your items", "Free"],
					]}
				/>
				<ManualText className="mt-3">
					<p>
						So a single change costs 2. Asking for four things at once costs 5,
						which is 2 for the ask and 1 for each task after the first. If Quick
						AI has to spread a long job over several replies, you are still only
						charged once for it.
					</p>
				</ManualText>
			</ManualSection>

			<ManualSection kind="opts" title="How many you get each month">
				<ManualTable
					caption="AI credits included with each plan"
					columns={["Plan", "Credits a month"]}
					rows={[
						["Starter", "15"],
						["Basic", "50"],
						["Pro", "150"],
						["Growth", "300"],
						["Premium", "600"],
					]}
				/>
				<Note kind="info" title="They do not roll over">
					<p>
						Credits reset at the start of each calendar month, counted in UTC.
						Anything you have not used is gone at the turn of the month, and
						there is no bonus for a new account beyond the monthly allowance.
					</p>
				</Note>
			</ManualSection>

			<ManualSection kind="info" title="Where to see what is left">
				<CreditMeterScreen />

				<Rules>
					<Rule>
						In the <PlaceName>Quick AI</PlaceName> panel header there is a small
						ring. Hovering it shows how many credits are left, and selecting it
						opens the detail.
					</Rule>
					<Rule>
						On the dashboard, the <TabName>Usage</TabName> tab has an{" "}
						<PlaceName>AI Credits</PlaceName> card with the same numbers.
					</Rule>
					<Rule>
						When Quick AI plans a longer job it tells you the estimate up front,
						for example <q>Working through 4 things &middot; about 5 credits</q>
						.
					</Rule>
				</Rules>
				<Note kind="info" title="The ring updates after an ask, not during one">
					<p>
						The number changes once the ask has finished, so it will not tick
						down while you watch.
					</p>
				</Note>
			</ManualSection>

			<ManualSection kind="info" title="When you run out">
				<ManualText className="mb-4">
					<p>What you see depends on where you hit the limit.</p>
				</ManualText>
				<ManualTable
					caption="What happens at each point you can run out"
					columns={["When", "What happens"]}
					rows={[
						[
							"Before you send",
							"Quicktalog does not send the ask. A dialog offers you a bigger plan instead.",
						],
						[
							"As you send",
							<>
								A red line in the chat reads{" "}
								<q>You have reached your monthly AI limit.</q>
							</>,
						],
						[
							"Part way through a long ask",
							"Quick AI stops, tells you which tasks it finished, and reminds you that credits come back at the start of the month. The finished work stays in your draft.",
						],
						[
							"When a page read cannot be paid for",
							"It carries on without reading the page and works from what you told it.",
						],
					]}
				/>
				<Note kind="warn" title="Work done before you ran out is still yours">
					<p>
						Everything ticked off before the stop is already in your draft.
						Select <ButtonName>Accept</ButtonName> to keep it rather than
						starting again next month.
					</p>
				</Note>
			</ManualSection>

			<ManualSection kind="rules" title="Good to know">
				<Rules>
					<Rule>
						An ask that is cut short by the one minute time limit still costs
						its credits.
					</Rule>
					<Rule>
						Reading a web page is not available on the free Starter plan at all.
					</Rule>
					<Rule>Paid plans can read up to 3 pages in one ask.</Rule>
					<Rule>
						There is a limit of 10 asks a minute and 60 an hour, whatever your
						plan.
					</Rule>
					<Rule>
						There is no way to buy credits on their own. More credits come with
						a bigger plan.
					</Rule>
				</Rules>
			</ManualSection>

			<ManualSection kind="fix" title="Messages">
				<Messages
					messages={[
						{
							text: "Need More AI Credits?",
							cause:
								"You tried to send an ask you cannot pay for, on a plan that includes some credits.",
							fix: "Look at the comparison in the dialog, then either wait for the month to reset or move to a bigger plan.",
						},
						{
							text: "Running low - the assistant still works.",
							cause: "You have used three quarters of this month's credits.",
							fix: "Nothing to do. It is a heads up, not a block.",
						},
						{
							text: "You are out until the month resets.",
							cause: "Every credit for this month is spent.",
							fix: "Wait for the start of next month, or move to a bigger plan.",
						},
					]}
				/>
			</ManualSection>
		</>
	);
}

const page: ManualPage = { Body, meta };
export default page;
