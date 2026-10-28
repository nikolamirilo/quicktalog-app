import { ButtonName, PlaceName } from "@/components/manual/Inline";
import { ManualSection } from "@/components/manual/ManualSection";
import { ManualText } from "@/components/manual/ManualText";
import {
	type MessageGroup,
	MessageFinder,
} from "@/components/manual/MessageFinder";
import { Note } from "@/components/manual/Note";
import type { ManualPage } from "./_types";

const groups: MessageGroup[] = [
	{
		area: "Publishing and sharing",
		messages: [
			{
				text: "Cannot publish: missing heading.",
				cause: "The catalogue has no heading.",
				fix: "Select Open Builder, then the placeholder at the top, and type a title.",
			},
			{
				text: "Cannot publish: missing content.",
				cause: "The catalogue has no sections.",
				fix: "Add at least one section.",
			},
			{
				text: "This month's traffic limit for your plan is reached",
				cause:
					"Your catalogues were opened more times this month than your plan allows.",
				fix: "Wait for the next month, or move to a bigger plan.",
			},
			{
				text: "Catalogue Not Found",
				cause:
					"What a visitor sees when a catalogue is a draft or switched off.",
				fix: "Publish it, or switch it back on from the actions menu.",
			},
			{
				text: "Could not activate this catalogue.",
				cause: "Usually the traffic limit.",
				fix: "Check the Usage tab on your dashboard.",
			},
		],
	},
	{
		area: "Saving and the builder",
		messages: [
			{
				text: "Failed to save the draft",
				cause: "Quicktalog could not reach the place drafts are kept.",
				fix: "Try Save again and keep the tab open until it works.",
			},
			{
				text: "Failed to save catalogue",
				cause: "The save was refused with no clearer reason.",
				fix: "Check whether the catalogue is over a plan limit, then try again.",
			},
			{
				text: "You have unsaved changes. Are you sure you want to leave?",
				cause: "You are leaving the builder with work that is not saved.",
				fix: "Choose Stay, then Save. Leave throws the changes away.",
			},
			{
				text: "Please save the catalogue first",
				cause:
					"Publishing was attempted before the catalogue had been saved once.",
				fix: "Select Save, then publish.",
			},
			{
				text: "Invalid data for this section",
				cause: "A section's stored content could not be read.",
				fix: "Set the section up again, or delete it and add a new one.",
			},
			{
				text: "Invalid item data",
				cause: "A stored item has no name.",
				fix: "Delete the item and add it again.",
			},
			{
				text: "Are you sure you want to delete this section?",
				cause: "You chose Delete section. This is your browser's own dialog.",
				fix: "Confirm to delete it with everything inside, or cancel.",
			},
		],
	},
	{
		area: "Pictures",
		messages: [
			{
				text: "SVG images aren't supported here. Please upload a PNG or JPG.",
				cause: "SVG files are not accepted anywhere in Quicktalog.",
				fix: "Export the picture as a PNG, or a JPG for photographs.",
			},
			{
				text: "File is too large. Please select a smaller image",
				cause: "The file is over 50 MB.",
				fix: "Use a smaller file. A normal phone photo is well within the limit.",
			},
			{
				text: "Please select a valid image file",
				cause: "The file is not a picture.",
				fix: "Choose a PNG, JPG or WebP.",
			},
			{
				text: "Processed image size (1300KB) exceeds maximum allowed size of 1200KB",
				cause: "Quicktalog could not shrink the picture enough.",
				fix: "Save it smaller, around 1200 pixels on the long side, and try again.",
			},
			{
				text: "Too many uploads, try again later",
				cause: "A lot of uploads in a short time.",
				fix: "Wait a minute and carry on.",
			},
		],
	},
	{
		area: "Quick AI",
		messages: [
			{
				text: "You have reached your monthly AI limit.",
				cause: "This month's credits are used up.",
				fix: "Wait for the month to turn over, or move to a bigger plan.",
			},
			{
				text: "Confirm your email address to use Quick AI.",
				cause:
					"You are on the free plan and have not opened the confirmation link.",
				fix: "Open the link in the email from when you signed up.",
			},
			{
				text: "Kept the AI changes, but they are not saved yet.",
				cause: "Accept worked but the save failed.",
				fix: "Select Save in the rail. The changes are still in your draft.",
			},
			{
				text: "Stopped - you are out of AI credits for this month. Everything ticked above is already in your draft.",
				cause: "A long ask ran out of credits part way through.",
				fix: "Accept what it finished rather than starting again later.",
			},
		],
	},
	{
		area: "Your account",
		messages: [
			{
				text: "That password is too weak. Use at least 8 characters with letters and digits.",
				cause: "The password does not meet the rules.",
				fix: "Use at least 8 characters with an uppercase letter, a lowercase letter and a number.",
			},
			{
				text: "That email address is already in use.",
				cause: "Another Quicktalog account has it.",
				fix: "Use a different address.",
			},
			{
				text: "Check both inboxes. The change is applied only after both links are confirmed.",
				cause: "An email change needs confirming from both addresses.",
				fix: "Open the link in the old inbox as well as the new one.",
			},
			{
				text: "This is your only sign-in method, so it cannot be disconnected.",
				cause: "Google is the only way into your account.",
				fix: "Set a password first. If it still refuses, contact support.",
			},
			{
				text: "Too many name changes. Try again in an hour.",
				cause: "Five name changes in the last hour.",
				fix: "Wait an hour.",
			},
			{
				text: "Enter a name of 1 to 80 characters.",
				cause: "The name was empty, only spaces, or too long.",
				fix: "Type a name between 1 and 80 characters.",
			},
		],
	},
	{
		area: "Plans and limits",
		messages: [
			{
				text: "You have reached the catalogue limit of your plan",
				cause: "You already have as many catalogues as your plan allows.",
				fix: "Delete one you do not need, or move to a bigger plan.",
			},
			{
				text: "Catalogue Limit Exceeded",
				cause:
					"Your plan allows fewer catalogues than you have, after a change or a cancellation.",
				fix: "The dialog cannot be closed. Tick enough catalogues to delete, or go back to a bigger plan.",
			},
			{
				text: "Upgrade required",
				cause:
					"A design group or section kind that your plan does not include.",
				fix: "Select Upgrade now, or use something your plan does include.",
			},
			{
				text: "Could not duplicate this catalogue. Your plan may not allow another one.",
				cause: "A copy would take you past your catalogue limit.",
				fix: "Select View plans, or delete a catalogue first.",
			},
			{
				text: "No embed code provided",
				cause: "An external content section was saved with an empty code box.",
				fix: "Open the section and paste the embed code in.",
			},
		],
	},
];

const meta = {
	slug: "troubleshooting",
	group: "reference",
	title: "Messages and fixes",
	inShort: "Find the message Quicktalog showed you, and what to do about it.",
	openMessages: true,
	keywords: [
		"error",
		"message",
		"problem",
		"not working",
		"fix",
		"troubleshooting",
		...groups.flatMap((group) => group.messages.map((message) => message.text)),
	],
	synonyms: ["help", "broken", "failed", "cannot", "why", "stuck"],
	related: ["limits", "glossary", "account-settings"],
} satisfies ManualPage["meta"];

function Body() {
	return (
		<>
			<ManualSection kind="info" title="Start with these four">
				<ManualText>
					<p>
						Most reports turn out to be one of these, and none of them is a
						fault.
					</p>
					<p>
						<strong>Your change is not showing for customers.</strong> You saved
						but did not publish.{" "}
						<ButtonName variant="secondary">Save</ButtonName> keeps your work
						privately. Only <ButtonName>Publish</ButtonName> changes your public
						page.
					</p>
					<p>
						<strong>Your link shows Catalogue Not Found.</strong> The catalogue
						is a draft or has been switched off. Publish it, or use{" "}
						<PlaceName>Change Status</PlaceName> then{" "}
						<PlaceName>Activate</PlaceName>.
					</p>
					<p>
						<strong>Publish is greyed out.</strong> Your catalogue has no
						heading, or no sections. The <PlaceName>+ Add Heading</PlaceName>{" "}
						placeholder does not count as a heading.
					</p>
					<p>
						<strong>Your work disappeared.</strong> Nothing in the builder saves
						by itself. Reloading or leaving without saving loses everything
						since your last save.
					</p>
				</ManualText>
			</ManualSection>

			<ManualSection kind="fix" title="Find your message">
				<ManualText className="mb-4">
					<p>
						Type any part of what you saw. You do not need to match the
						punctuation or the capitals.
					</p>
				</ManualText>
				<MessageFinder groups={groups} />
			</ManualSection>

			<ManualSection kind="link" title="Still stuck">
				<ManualText>
					<p>
						The <PlaceName>Support</PlaceName> tab on your dashboard has an
						email form, already filled in with your details, and a link to book
						a free 30 minute call. Email replies come within one business day.
					</p>
				</ManualText>
				<Note kind="info" title="An embed that shows nothing at all">
					<p>
						No message appears for this one. The embed came from a site that is
						not on the allowed list, or it needed a script, which Quicktalog
						removes. Try an embed from Google Maps, YouTube, Vimeo, Spotify or
						Calendly.
					</p>
				</Note>
			</ManualSection>
		</>
	);
}

const page: ManualPage = { Body, meta };
export default page;
