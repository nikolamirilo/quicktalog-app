import { ButtonName, KeyName, PlaceName } from "@/components/manual/Inline";
import { ManualSection } from "@/components/manual/ManualSection";
import { ManualTable } from "@/components/manual/ManualTable";
import { ManualText } from "@/components/manual/ManualText";
import { Messages } from "@/components/manual/Messages";
import { Note } from "@/components/manual/Note";
import { Rule, Rules } from "@/components/manual/Rules";
import { FollowAlong } from "@/components/manual/Screen";
import { QuickAiScreen } from "@/components/manual/screens/QuickAiScreen";
import { Step, Steps } from "@/components/manual/Steps";
import type { ManualPage } from "./_types";

const meta = {
	slug: "quick-ai",
	group: "assistant",
	title: "Make changes with Quick AI",
	inShort:
		"Ask for a change in your own words, look at what it did, then keep it or undo it.",
	result:
		"The change you asked for, in your draft, with the choice to accept or reject it.",
	where: ["Builder", "Quick AI"],
	before: [
		{
			text: "You have a catalogue open in the builder.",
			href: "builder-basics",
		},
		{ text: "You have AI credits left this period.", href: "ai-credits" },
	],
	keywords: [
		"ai",
		"quick ai",
		"assistant",
		"chat",
		"accept",
		"reject",
		"ocr",
		"photos",
	],
	synonyms: [
		"ask ai",
		"chatbot",
		"generate",
		"write for me",
		"scan menu",
		"import photo",
		"read website",
	],
	related: ["ai-credits", "builder-basics", "items"],
} satisfies ManualPage["meta"];

function Body() {
	return (
		<>
			<ManualSection kind="info" title="What it can do">
				<ManualText>
					<p>
						Quick AI sits in the builder and edits the catalogue you have open.
						You describe a change in ordinary words and it makes it. It can add,
						change, move and remove sections and items, rewrite your text,
						change prices, find photos, switch the theme, set your colours and
						fonts, and fill in your header, footer and contact details.
					</p>
					<p>
						It can also read a printed menu from photos you attach, and read a
						web page if you paste in its address.
					</p>
				</ManualText>
				<Note kind="warn" title="Open it from the bottom left, not the rail">
					<p>
						On a computer, Quick AI is a floating button in the bottom left
						corner of the builder, labelled{" "}
						<ButtonName variant="secondary">Quick AI</ButtonName>. It is not in
						the tool rail on the right. On a phone it is the first button in the
						bottom bar.
					</p>
				</Note>
			</ManualSection>

			<ManualSection kind="steps" title="Ask for a change">
				<FollowAlong screen={<QuickAiScreen />}>
					<Steps>
						<Step
							title={
								<>
									Select <ButtonName variant="secondary">Quick AI</ButtonName>
								</>
							}
						>
							<p>
								The panel opens beside your catalogue, or as a full sheet on a
								phone.
							</p>
						</Step>
						<Step spot={4} title="Describe what you want">
							<p>
								Be specific. Item names, prices, sizes and the order you want
								things in all help. Press <KeyName>Enter</KeyName> to send, or
								tap one of the four examples{" "}
								<ButtonName variant="secondary">Try one of these</ButtonName> to
								send it straight away.
							</p>
						</Step>
						<Step
							done="Its changes appear in your catalogue, highlighted, with a bar offering Accept and Reject."
							title="Watch it work"
						>
							<p>
								It writes back as it goes and tells you which step it is on. For
								a bigger ask it writes a short list of tasks first and ticks
								them off.
							</p>
						</Step>
						<Step
							done="Accept also saves your draft, so you do not need to save again."
							title={
								<>
									Select <ButtonName>Accept</ButtonName> or{" "}
									<ButtonName variant="secondary">Reject</ButtonName>
								</>
							}
						>
							<p>
								<ButtonName>Accept</ButtonName> keeps the changes and saves.{" "}
								<ButtonName variant="secondary">Reject</ButtonName> puts the
								catalogue back exactly as it was before the first change.
							</p>
						</Step>
					</Steps>
				</FollowAlong>
			</ManualSection>

			<ManualSection kind="info" title="The review bar">
				<ManualText className="mb-4">
					<p>
						While Quick AI is working the bar reads{" "}
						<q>Quick AI is still making changes</q>. When it finishes it counts
						what it did, for example <q>3 AI changes to review</q>, with the
						line{" "}
						<q>
							Highlighted on your catalogue. Accept to keep them, or reject to
							undo them all.
						</q>
					</p>
					<p>
						Accept and Reject apply to everything in that batch together. You
						cannot keep one change and drop another.
					</p>
				</ManualText>
			</ManualSection>

			<ManualSection kind="risk" title="Three things end your chance to undo">
				<ManualText>
					<p>
						<ButtonName variant="secondary">Reject</ButtonName> is the only undo
						in Quicktalog, and it stops being available as soon as any of these
						happens:
					</p>
				</ManualText>
				<Rules>
					<Rule>
						<strong>You send another message.</strong> The changes still under
						review are quietly accepted and saved first.
					</Rule>
					<Rule>
						<strong>You edit something by hand.</strong> The review ends and the
						changes stay.
					</Rule>
					<Rule>
						<strong>You publish.</strong> Publishing keeps the changes under
						review as well.
					</Rule>
				</Rules>
				<Note kind="warn" title="Clear conversation does not undo anything">
					<p>
						The <PlaceName>Clear conversation</PlaceName> button empties the
						chat and stops whatever is running. Your catalogue keeps every
						change that was made. If you want the changes gone, select{" "}
						<ButtonName variant="secondary">Reject</ButtonName> first.
					</p>
				</Note>
			</ManualSection>

			<ManualSection
				kind="steps"
				title="Build from a printed menu or a web page"
			>
				<ManualText className="mb-4">
					<p>
						There is no separate import screen. Both of these happen in the
						chat.
					</p>
				</ManualText>
				<ManualTable
					caption="Starting from something you already have"
					columns={["What you have", "What to do", "What it costs"]}
					rows={[
						[
							"Photos of a printed menu or price list",
							"Attach or paste the photos in the chat, with a message such as putting these on the page. Your browser reads the text out of them before the message is sent.",
							"Reading the photos is free. The change itself costs the usual credits.",
						],
						[
							"An existing web page",
							"Paste the address into the chat and say what to take from it.",
							"2 extra credits per page. Not available on the free Starter plan.",
						],
					]}
				/>
				<Note kind="info" title="Set the language before you scan">
					<p>
						Photos are read in the language set on your catalogue. If your menu
						is not in English, change <PlaceName>Language</PlaceName> in the{" "}
						<PlaceName>General</PlaceName> tab of the editor panel first, or the
						text will come out wrong.
					</p>
				</Note>
			</ManualSection>

			<ManualSection kind="rules" title="Good to know">
				<Rules>
					<Rule>
						A question costs nothing. Asking what a setting does, or what your
						catalogue contains, is free.
					</Rule>
					<Rule>
						Changes go into your draft, not onto your public page. You still
						have to publish.
					</Rule>
					<Rule>
						Closing the panel does not stop it. The ask carries on. Only{" "}
						<PlaceName>Clear conversation</PlaceName> stops it.
					</Rule>
					<Rule>
						It will change the layout of a section without being asked if you
						give it photos for a section whose layout hides pictures, because
						otherwise you would not see them.
					</Rule>
					<Rule>
						An item showing the plain placeholder picture counts as having no
						picture, so it will be given one when you ask for photos.
					</Rule>
					<Rule>
						An ask has to finish within about a minute. A very large request can
						be cut off part way, and the credits for it are still spent.
					</Rule>
					<Rule>
						It cannot change the glass effect, the background or the overlay.
						Those are yours to set in the <PlaceName>Appearance</PlaceName> tab.
					</Rule>
					<Rule>The chat is not kept. Closing the builder clears it.</Rule>
					<Rule>
						On the free Starter plan you also need a confirmed email address
						before you can use it.
					</Rule>
				</Rules>
			</ManualSection>

			<ManualSection kind="fix" title="Messages">
				<Messages
					messages={[
						{
							text: "You have reached your AI credit limit for this period.",
							cause: "Your credits for this period are used up.",
							fix: "Wait for your period to turn over, or move to a bigger plan.",
						},
						{
							text: "Confirm your email address to use Quick AI.",
							cause:
								"You are on the free plan and have not opened the confirmation link yet.",
							fix: "Open the link in the email Quicktalog sent you when you signed up, then come back.",
						},
						{
							text: "Kept and saved the AI changes.",
							cause: "You selected Accept and the save worked.",
							fix: "Nothing to do. Publish when you are ready.",
						},
						{
							text: "Kept the AI changes, but they are not saved yet.",
							cause: "You selected Accept but saving failed.",
							fix: "Select Save in the rail. The changes are still in your draft.",
						},
						{
							text: "Undid the AI changes.",
							cause: "You selected Reject.",
							fix: "Nothing to do. Your catalogue is back as it was.",
						},
						{
							text: "Stopped - you are out of AI credits for this period. Everything ticked above is already in your draft.",
							cause:
								"A long ask ran out of credits part way through its list of tasks.",
							fix: "The finished tasks are yours to keep. Accept them, then come back next period or move to a bigger plan.",
						},
					]}
				/>
			</ManualSection>
		</>
	);
}

const page: ManualPage = { Body, meta };
export default page;
