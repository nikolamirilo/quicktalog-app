import {
	ButtonName,
	FieldName,
	PlaceName,
	TabName,
	Value,
} from "@/components/manual/Inline";
import { ManualSection } from "@/components/manual/ManualSection";
import { ManualTable } from "@/components/manual/ManualTable";
import { ManualText } from "@/components/manual/ManualText";
import { Messages } from "@/components/manual/Messages";
import { Note } from "@/components/manual/Note";
import { Option, Options } from "@/components/manual/Options";
import { Rule, Rules } from "@/components/manual/Rules";
import { Step, Steps } from "@/components/manual/Steps";
import { SettingsScreen } from "@/components/manual/screens/SettingsScreen";
import type { ManualPage } from "./_types";

const meta = {
	slug: "account-settings",
	group: "account",
	title: "Your account and sign-in",
	inShort:
		"Change your name, email address or password, manage Google and cookies, and close your account.",
	result:
		"Your account details are up to date and your sign-in is set up how you want it.",
	where: ["Dashboard", "Settings"],
	keywords: [
		"account",
		"settings",
		"password",
		"email",
		"google",
		"cookies",
		"sessions",
		"delete account",
	],
	synonyms: [
		"change password",
		"sign out",
		"two factor",
		"close account",
		"profile",
		"log out",
	],
	related: ["dashboard", "billing", "plans"],
} satisfies ManualPage["meta"];

function Body() {
	return (
		<>
			<ManualSection kind="info" title="Where the settings are">
				<ManualText>
					<p>
						Everything here is in the <TabName>Settings</TabName> tab of your
						dashboard, in three cards: <PlaceName>Account</PlaceName>,{" "}
						<PlaceName>Privacy and sessions</PlaceName> and a red{" "}
						<PlaceName>Danger zone</PlaceName>. Only one row can be open at a
						time, and each has{" "}
						<ButtonName variant="secondary">Cancel</ButtonName> beside its save
						button.
					</p>
				</ManualText>
				<SettingsScreen />
			</ManualSection>

			<ManualSection kind="opts" title="Account">
				<Options>
					<Option limit="1 to 80 characters" name="Name">
						<p>
							Shown in your dashboard and used in the emails Quicktalog sends
							you. Select <ButtonName variant="secondary">Edit</ButtonName>,
							change it, then <ButtonName>Save name</ButtonName>. You can change
							it 5 times an hour.
						</p>
					</Option>
					<Option name="Email">
						<p>
							Select <ButtonName variant="secondary">Change</ButtonName> and
							type the new address, then{" "}
							<ButtonName>Send confirmation links</ButtonName>. Quicktalog
							emails both the old and the new address, and{" "}
							<strong>nothing changes until you open both links</strong>. Until
							then your old address still works.
						</p>
					</Option>
					<Option limit="At least 8 characters" name="Password">
						<p>
							You need your current password, then the new one twice. Every
							other device is signed out, but the one you are using stays signed
							in. Quicktalog may also email you a code to type in before the
							change goes through.
						</p>
					</Option>
					<Option name="Google">
						<p>
							Connect your Google account so you can sign in with it, or
							disconnect it. If Google is the only way into your account you
							cannot disconnect it, and the row explains why.
						</p>
					</Option>
				</Options>
				<Note kind="warn" title="Your password needs more than length">
					<p>
						The hint says at least 8 characters. In practice Quicktalog also
						needs a lowercase letter, an uppercase letter and a number. A long
						password of only lowercase letters is refused as too weak.
					</p>
				</Note>
			</ManualSection>

			<ManualSection kind="opts" title="Privacy and sessions">
				<Options>
					<Option name="Cookies">
						<p>
							Opens <PlaceName>Cookie Settings</PlaceName>, where{" "}
							<FieldName>Analytics</FieldName> and{" "}
							<FieldName>Marketing</FieldName> are both off until you switch
							them on. <FieldName>Essential Cookies</FieldName> cannot be
							switched off, because sign-in needs them. While you are signed in,
							your choice follows your account.
						</p>
					</Option>
					<Option name="Sessions">
						<p>
							<ButtonName variant="secondary">Sign out</ButtonName> ends this
							browser&apos;s session.{" "}
							<ButtonName variant="secondary">Sign out everywhere</ButtonName>{" "}
							ends every session, this one included. Neither asks you to
							confirm, so take care with the second one.
						</p>
					</Option>
				</Options>
			</ManualSection>

			<ManualSection kind="risk" title="Deleting your account">
				<ManualText className="mb-4">
					<p>
						This cancels your subscription, then deletes your account and every
						catalogue you own. Published pages stop working at once. There is no
						way back and no export first, so save anything you want to keep
						before you start.
					</p>
				</ManualText>
				<Steps>
					<Step
						title={
							<>
								In <PlaceName>Danger zone</PlaceName>, select{" "}
								<ButtonName variant="secondary">Delete account</ButtonName>
							</>
						}
					/>
					<Step
						title={
							<>
								Type <Value>DELETE</Value> in the field
							</>
						}
					>
						<p>
							In capitals, exactly. The delete button stays switched off until
							it matches.
						</p>
					</Step>
					<Step
						done="You are signed out and returned to the Quicktalog home page."
						title={
							<>
								Select{" "}
								<ButtonName variant="secondary">Delete permanently</ButtonName>
							</>
						}
					>
						<p>
							The dialog cannot be closed while it works.{" "}
							<ButtonName variant="secondary">Keep my account</ButtonName> backs
							out before that.
						</p>
					</Step>
				</Steps>
				<Note kind="info" title="Your subscription is cancelled first">
					<p>
						If the subscription cannot be cancelled, nothing is deleted and you
						are asked to contact support. That is deliberate, so you are never
						left paying for a deleted account.
					</p>
				</Note>
			</ManualSection>

			<ManualSection kind="info" title="Getting help">
				<ManualTable
					caption="The two ways to reach support from the Support tab"
					columns={["Way", "What to expect"]}
					rows={[
						[
							<ButtonName key="t">Schedule a meeting</ButtonName>,
							"A free 30 minute call, booked from a calendar in the dialog.",
						],
						[
							<PlaceName key="t">Email Support</PlaceName>,
							"A form, already filled in with your name and email. A reply within 1 business day. Up to 5 messages an hour.",
						],
					]}
				/>
			</ManualSection>

			<ManualSection kind="rules" title="Good to know">
				<Rules>
					<Rule>
						The first time you sign in you have to accept the terms, the privacy
						policy and the refund policy before you can use the dashboard.
					</Rule>
					<Rule>
						Signing up with Google still asks you to accept those three.
					</Rule>
					<Rule>
						Cookie choices and the legal acceptance are separate. Changing your
						cookies does not touch the other.
					</Rule>
					<Rule>
						Your plan and your invoices are not in <TabName>Settings</TabName>.
						They are in <TabName>Subscription</TabName>.
					</Rule>
				</Rules>
			</ManualSection>

			<ManualSection kind="fix" title="Messages">
				<Messages
					messages={[
						{
							text: "Enter a name of 1 to 80 characters.",
							cause: "The name was empty, only spaces, or too long.",
							fix: "Type a name between 1 and 80 characters.",
						},
						{
							text: "Too many name changes. Try again in an hour.",
							cause: "You have changed your name 5 times in the last hour.",
							fix: "Wait an hour.",
						},
						{
							text: "That email address is already in use.",
							cause: "Another Quicktalog account has it.",
							fix: "Use a different address.",
						},
						{
							text: "Check both inboxes. The change is applied only after both links are confirmed.",
							cause: "The confirmation emails were sent.",
							fix: "Open the link in both the old and the new inbox. Nothing changes until you do.",
						},
						{
							text: "That password is not correct.",
							cause: "The current password you typed does not match.",
							fix: "Try again, or sign out and use the password reset link on the sign in page.",
						},
						{
							text: "That password is too weak. Use at least 8 characters with letters and digits.",
							cause: "The new password does not meet the rules.",
							fix: "Use at least 8 characters with an uppercase letter, a lowercase letter and a number.",
						},
						{
							text: "The two new passwords do not match.",
							cause: "The repeat does not match the new password.",
							fix: "Retype both carefully.",
						},
						{
							text: "We emailed you a confirmation code. Enter it below.",
							cause:
								"Quicktalog wants a second check before changing your password.",
							fix: "Find the code in your inbox and type it into the field that appeared.",
						},
						{
							text: "This is your only sign-in method, so it cannot be disconnected.",
							cause: "Google is the only way into your account.",
							fix: "Set a password first, then try again. This can keep happening for Google accounts, so contact support if it does.",
						},
						{
							text: "We could not cancel your subscription, so nothing was deleted. Please contact support.",
							cause:
								"The subscription had to be cancelled first and it failed.",
							fix: "Contact support. Your account and catalogues are untouched.",
						},
					]}
				/>
			</ManualSection>
		</>
	);
}

const page: ManualPage = { Body, meta };
export default page;
