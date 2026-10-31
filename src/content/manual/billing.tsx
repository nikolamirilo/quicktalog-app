import { ButtonName, PlaceName, TabName } from "@/components/manual/Inline";
import { ManualSection } from "@/components/manual/ManualSection";
import { ManualTable } from "@/components/manual/ManualTable";
import { ManualText } from "@/components/manual/ManualText";
import { Messages } from "@/components/manual/Messages";
import { Note } from "@/components/manual/Note";
import { Rule, Rules } from "@/components/manual/Rules";
import { Step, Steps } from "@/components/manual/Steps";
import { SubscriptionScreen } from "@/components/manual/screens/SubscriptionScreen";
import type { ManualPage } from "./_types";

const meta = {
	slug: "billing",
	group: "account",
	title: "Upgrade, change or cancel",
	inShort:
		"Move to another plan, find your invoices, and understand what cancelling does.",
	result:
		"You are on the plan you want, and you know what happens to your catalogues.",
	where: ["Dashboard", "Subscription"],
	keywords: [
		"upgrade",
		"cancel",
		"downgrade",
		"invoice",
		"refund",
		"paddle",
		"checkout",
	],
	synonyms: [
		"change plan",
		"stop paying",
		"billing",
		"receipt",
		"money back",
		"payment",
	],
	related: ["plans", "account-settings", "limits"],
} satisfies ManualPage["meta"];

function Body() {
	return (
		<>
			<ManualSection kind="steps" title="Move to a bigger plan">
				<SubscriptionScreen />

				<Steps>
					<Step
						title={
							<>
								Open the <TabName>Subscription</TabName> tab and select{" "}
								<ButtonName>Upgrade plan</ButtonName>
							</>
						}
					>
						<p>
							Many limit dialogs also have a button straight to the plan you
							need.
						</p>
					</Step>
					<Step title="Choose a plan and pay">
						<p>
							Payment is handled by Paddle in a checkout window. Quicktalog
							never sees or stores your card details.
						</p>
					</Step>
					<Step
						done="Your new limits apply at once. A Payment Successful page confirms it."
						title="Come back to your dashboard"
					>
						<p>
							There is a <ButtonName>Return to Dashboard</ButtonName> button on
							that page.
						</p>
					</Step>
				</Steps>
				<Note kind="warn" title="A plan change is a fresh purchase">
					<p>
						Changing plan opens a new checkout at the full price of the new
						plan, and your old subscription is then cancelled straight away.
						There is no part refund of the time you had already paid for, so a
						change part way through a month is best made close to your renewal
						date.
					</p>
				</Note>
			</ManualSection>

			<ManualSection kind="info" title="Change, cancel, or neither">
				<ManualTable
					caption="The difference between changing your plan and cancelling"
					columns={["", "Changing plan", "Cancelling"]}
					rows={[
						[
							"Where",
							<>
								<TabName>Subscription</TabName>, then{" "}
								<ButtonName>Upgrade plan</ButtonName>
							</>,
							<>
								<TabName>Subscription</TabName>, then{" "}
								<ButtonName variant="secondary">Manage subscription</ButtonName>
							</>,
						],
						[
							"When it takes effect",
							"Immediately.",
							"At the end of the period you have paid for.",
						],
						[
							"What you pay",
							"The full price of the new plan, now.",
							"Nothing more. Renewals stop.",
						],
						[
							"Your catalogues",
							"Keep working, with the new limits.",
							"You drop to Starter, which allows one catalogue. The rest go offline.",
						],
					]}
				/>
				<Note
					kind="info"
					title="Cancelling happens in the payment provider's portal"
				>
					<p>
						<ButtonName variant="secondary">Manage subscription</ButtonName>{" "}
						opens Paddle&apos;s customer portal in a new tab. Cancelling,
						updating your card and finding your invoices all happen there, in
						Paddle&apos;s own wording rather than Quicktalog&apos;s. There is no
						cancel button inside Quicktalog.
					</p>
				</Note>
			</ManualSection>

			<ManualSection
				kind="risk"
				title="What cancelling does to your catalogues"
			>
				<ManualText>
					<p>
						When the period you paid for ends, your account drops to Starter.
						Starter allows one catalogue, so your most recently updated
						catalogue stays on and{" "}
						<strong>every other one is switched off</strong>. Their links start
						showing <PlaceName>Catalogue Not Found</PlaceName>.
					</p>
					<p>
						Nothing is deleted. Your sections and items are all still there, and
						going back to a paid plan switches them on again. Quicktalog emails
						you when this happens, with the subject{" "}
						<q>Your Quicktalog subscription has ended</q>, listing the
						catalogues that went offline.
					</p>
				</ManualText>
				<Note kind="risk" title="A smaller plan also erases some settings">
					<p>
						Your own navbar and footer, your custom colours, background, glass
						effect, overlay, newsletter and your own analytics tags are cleared
						from the catalogue, not just hidden. Upgrading again does not bring
						them back and you will have to set them up once more.
					</p>
				</Note>
			</ManualSection>

			<ManualSection kind="info" title="Invoices and refunds">
				<Rules>
					<Rule>
						Invoices and past payments are in Paddle&apos;s portal, through{" "}
						<ButtonName variant="secondary">Manage subscription</ButtonName>.
						Quicktalog does not issue its own.
					</Rule>
					<Rule>
						Quicktalog advertises a 10 day money back guarantee on a first
						purchase. The refund policy page has the details and the conditions.
					</Rule>
					<Rule>
						Renewals are generally not refundable, so cancel before your renewal
						date rather than just after it.
					</Rule>
					<Rule>
						Your renewal date is not shown anywhere in Quicktalog. Paddle&apos;s
						portal is the only place to see it.
					</Rule>
				</Rules>
			</ManualSection>

			<ManualSection kind="rules" title="Good to know">
				<Rules>
					<Rule>
						Picking a cheaper plan on the pricing page is possible, but it works
						the same as any other change: a new checkout at full price and the
						old subscription cancelled at once.
					</Rule>
					<Rule>
						Nothing is emailed when you change plan. The only email in this area
						is the one when a subscription ends.
					</Rule>
					<Rule>
						There is no warning before a cancellation takes your catalogues
						offline, and no grace period after a failed payment. Keep an eye on
						your card expiry date.
					</Rule>
					<Rule>
						Deleting your account cancels your subscription first. See{" "}
						<PlaceName>Your account and sign-in</PlaceName>.
					</Rule>
				</Rules>
			</ManualSection>

			<ManualSection kind="fix" title="Messages">
				<Messages
					messages={[
						{
							text: "Payment Successful!",
							cause: "Your checkout went through.",
							fix: "Select Return to Dashboard. Your new limits are already live.",
						},
						{
							text: "Your Quicktalog subscription has ended",
							cause:
								"The subject of the email sent when a cancellation takes effect.",
							fix: "It lists the catalogues that went offline. Go to a paid plan to switch them back on.",
						},
						{
							text: "Catalogue Limit Exceeded",
							cause:
								"You have more catalogues than your new plan allows, after a cancellation or a change.",
							fix: "The dialog cannot be closed. Tick enough catalogues to delete, or go back to a bigger plan.",
						},
					]}
				/>
			</ManualSection>
		</>
	);
}

const page: ManualPage = { Body, meta };
export default page;
