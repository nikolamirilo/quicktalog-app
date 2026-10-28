import { Checklist, ChecklistItem } from "@/components/manual/Checklist";
import {
	ButtonName,
	FieldName,
	PlaceName,
	TabName,
} from "@/components/manual/Inline";
import { ManualSection } from "@/components/manual/ManualSection";
import { ManualText } from "@/components/manual/ManualText";
import { Note } from "@/components/manual/Note";
import { Rule, Rules } from "@/components/manual/Rules";
import { FollowAlong } from "@/components/manual/Screen";
import { AuthScreen } from "@/components/manual/screens/AuthScreen";
import { BuilderScreen } from "@/components/manual/screens/BuilderScreen";
import { CreateCatalogueScreen } from "@/components/manual/screens/CreateCatalogueScreen";
import { ItemScreen } from "@/components/manual/screens/ItemScreen";
import { PublishSuccessScreen } from "@/components/manual/screens/PublishSuccessScreen";
import { TemplateScreen } from "@/components/manual/screens/TemplateScreen";
import { Step, Steps } from "@/components/manual/Steps";
import type { ManualPage } from "./_types";

const meta = {
	slug: "quickstart",
	group: "get-started",
	title: "Build and publish your first catalogue",
	inShort:
		"Follow along from an empty account to a live catalogue you can send to someone.",
	result:
		"A published catalogue at your own link, with a QR code if you want one.",
	before: [{ text: "An email address. No card is needed for the free plan." }],
	checklist: true,
	keywords: [
		"quickstart",
		"tutorial",
		"first catalogue",
		"getting started",
		"walkthrough",
	],
	synonyms: [
		"how do i start",
		"step by step",
		"first time",
		"beginner",
		"set up",
	],
	related: ["create-catalogue", "items", "publish"],
} satisfies ManualPage["meta"];

function Body() {
	return (
		<>
			<ManualSection kind="info" title="Before you begin">
				<ManualText>
					<p>
						This takes about twenty minutes. Each part below shows the screen
						you will be on, with the steps underneath it. Hover a step number to
						light up the part of the screen it talks about.
					</p>
					<p>
						Have your list to hand: the names, the prices and a few photos. You
						can change all of it later, so a rough first version beats waiting
						until everything is perfect.
					</p>
				</ManualText>
				<Note kind="info" title="Your ticks are saved">
					<p>
						The checklist at the end of this page is kept in this browser, and
						your progress shows in the column on the right. You can stop part
						way and come back.
					</p>
				</Note>
			</ManualSection>

			<ManualSection kind="steps" title="Part 1: Create your account">
				<FollowAlong screen={<AuthScreen />}>
					<Steps>
						<Step
							spot={1}
							title={
								<>
									Open the sign-in page and choose{" "}
									<PlaceName>Create account</PlaceName>
								</>
							}
						>
							<p>
								The <ButtonName>Start free</ButtonName> button in the navbar
								opens this tab for you.
							</p>
						</Step>
						<Step spot={3} title="Fill in your name, email and a password">
							<p>
								At least 8 characters, with a capital, a lowercase letter and a
								number. The strength meter is only a hint, so a password it
								calls <FieldName>Fair</FieldName> can still be refused if it has
								no digit.
							</p>
						</Step>
						<Step
							done="The card is replaced by a Check your inbox message."
							spot={4}
							title={
								<>
									Select <ButtonName>Create account</ButtonName>
								</>
							}
						>
							<p>
								Pressing this button is how you accept the terms, the privacy
								policy and the refund policy. There is no separate tick box.
							</p>
						</Step>
						<Step
							done="You land on your dashboard."
							title="Open the confirmation link in your inbox"
						>
							<p>
								The link lasts 24 hours. On the free plan Quick AI will not work
								until you have opened it.
							</p>
						</Step>
					</Steps>
				</FollowAlong>
				<Note kind="info" title="You will be asked one question">
					<p>
						The first time the dashboard opens, Quicktalog asks how you heard
						about it. The question cannot be closed, but{" "}
						<ButtonName variant="secondary">Skip</ButtonName> counts as an
						answer, so it is never asked again.
					</p>
				</Note>
			</ManualSection>

			<ManualSection kind="steps" title="Part 2: Create the catalogue">
				<FollowAlong screen={<CreateCatalogueScreen />}>
					<Steps>
						<Step
							title={
								<>
									Select the round <ButtonName>+</ButtonName> button at the
									bottom right of the dashboard
								</>
							}
						/>
						<Step
							done='A green line reads "Great! This name is available."'
							spot={1}
							title="Type a name"
						>
							<p>
								Letters, numbers and spaces, up to 60 characters. Watch the
								address preview underneath as you type.
							</p>
						</Step>
						<Step spot={2} title="Choose the language and the currency">
							<p>
								They start at <PlaceName>English</PlaceName> and{" "}
								<PlaceName>Euro</PlaceName>. Set the language to the one your
								menu is written in, because Quick AI uses it to read photos
								later.
							</p>
						</Step>
						<Step spot={4} title="Choose your business type">
							<p>
								Nothing is pre-filled here, so the button stays switched off
								until you pick one.
							</p>
						</Step>
						<Step
							done="The builder opens with the template picker already showing."
							spot={6}
							title={
								<>
									Select <ButtonName>Create Catalog</ButtonName>
								</>
							}
						/>
					</Steps>
				</FollowAlong>
				<Note kind="risk" title="The name decides your web address, for good">
					<p>
						Your address is built from this name and can never be changed
						afterwards. The only way to a different one is to duplicate the
						catalogue and delete the original. Get it right before you print
						anything.
					</p>
				</Note>
			</ManualSection>

			<ManualSection kind="steps" title="Part 3: Pick a starting layout">
				<FollowAlong screen={<TemplateScreen />}>
					<Steps>
						<Step spot={1} title="Leave Quick Start selected">
							<p>
								Two sections with three example items each, which you are about
								to replace. It is already chosen for you.
							</p>
						</Step>
						<Step
							done="Your catalogue fills with example content you can edit."
							spot={4}
							title={
								<>
									Select <ButtonName>Select template</ButtonName>
								</>
							}
						/>
					</Steps>
				</FollowAlong>
				<Note kind="warn" title="Avoid Standard Catalog on the free plan">
					<p>
						Its five sections and fifteen items are exactly what Starter allows,
						so you would not be able to add anything else without deleting
						something first. The card says four categories; there are five.
					</p>
				</Note>
			</ManualSection>

			<ManualSection kind="steps" title="Part 4: Make it yours">
				<FollowAlong screen={<BuilderScreen />}>
					<Steps>
						<Step title="Select the heading at the top and type your business name">
							<p>
								Required before you can publish. Up to 100 characters. A small
								toolbar gives you bold, italic and four sizes.
							</p>
						</Step>
						<Step spot={4} title="Rename the first section">
							<p>
								Open its actions menu, choose{" "}
								<PlaceName>Edit section</PlaceName>, and name it after a real
								group such as <PlaceName>Breakfast</PlaceName>.
							</p>
						</Step>
						<Step spot={5} title="Add any sections you still need">
							<p>
								The dashed tile at the bottom adds one. On the free plan you get
								five in total, and a text block or a divider counts as one.
							</p>
						</Step>
						<Step spot={1} title="Try a theme">
							<p>
								Open <PlaceName>Editor</PlaceName>, then the{" "}
								<TabName>Appearance</TabName> tab. All seven themes are on every
								plan, and each tile is drawn in its own colours.
							</p>
						</Step>
						<Step
							done='A toast reads "Catalogue saved successfully".'
							spot={2}
							title={
								<>
									Select <ButtonName variant="secondary">Save</ButtonName>
								</>
							}
						>
							<p>Nothing saves by itself. Do this every few minutes.</p>
						</Step>
					</Steps>
				</FollowAlong>
			</ManualSection>

			<ManualSection kind="steps" title="Part 5: Put in your own items">
				<FollowAlong screen={<ItemScreen />}>
					<Steps>
						<Step title="Select Edit item on one of the examples">
							<p>
								Its three dot menu, then <PlaceName>Edit item</PlaceName>. The
								same dialog is used for adding and editing.
							</p>
						</Step>
						<Step spot={1} title="Replace the name">
							<p>The only thing you must fill in.</p>
						</Step>
						<Step spot={3} title="Set the price">
							<p>
								Digits and up to two decimals, with a full stop. The currency
								comes from the catalogue, so do not type it.
							</p>
						</Step>
						<Step spot={5} title="Add a picture">
							<p>
								Drop a file on <TabName>Upload</TabName>, or paste a web address
								under <TabName>URL</TabName>. A photo straight off a phone is
								fine, Quicktalog shrinks it.
							</p>
						</Step>
						<Step
							done="The item appears in the section."
							spot={6}
							title={
								<>
									Select <ButtonName>Add item</ButtonName>, or{" "}
									<ButtonName variant="secondary">
										Add item &amp; add another
									</ButtonName>
								</>
							}
						>
							<p>
								The second one keeps the dialog open, which is much quicker for
								a long list. Delete any examples you do not need, then save.
							</p>
						</Step>
					</Steps>
				</FollowAlong>
				<Note kind="warn" title="A blank price reads as Free">
					<p>
						Leaving the price empty, or typing 0, shows your customers the word{" "}
						<FieldName>Free</FieldName>. If you would rather not show prices,
						put them in the description instead.
					</p>
				</Note>
			</ManualSection>

			<ManualSection kind="steps" title="Part 6: Publish and share">
				<FollowAlong screen={<PublishSuccessScreen />}>
					<Steps>
						<Step title="Check it first with Preview">
							<p>
								<ButtonName variant="secondary">Preview</ButtonName> in the rail
								saves your draft and opens it at a private address only you can
								open. Look at it on your phone, which is where most of your
								customers will be.
							</p>
						</Step>
						<Step
							done="This dialog opens and your catalogue is live."
							title={
								<>
									Select <ButtonName>Publish</ButtonName>
								</>
							}
						>
							<p>
								There is no confirmation step. It goes live the moment you
								select it.
							</p>
						</Step>
						<Step spot={1} title="Copy your link">
							<p>
								Send it to yourself and open it on a device that is not signed
								in, to see exactly what a customer sees.
							</p>
						</Step>
						<Step spot={2} title="Make a QR code if you want one">
							<p>
								For your own design, go to the catalogue&apos;s actions menu on
								the dashboard and choose <PlaceName>QR Code</PlaceName>. Scan it
								yourself before printing.
							</p>
						</Step>
					</Steps>
				</FollowAlong>
				<Note kind="warn" title="Publishing is real">
					<p>
						Your catalogue is public from this moment, and your own visits count
						in your numbers and towards your monthly traffic allowance. If you
						are only practising, stop at{" "}
						<ButtonName variant="secondary">Preview</ButtonName> and leave it as
						a draft.
					</p>
				</Note>
			</ManualSection>

			<ManualSection kind="steps" title="Your checklist">
				<Checklist>
					<ChecklistItem id="account">
						Account created and the confirmation link opened
					</ChecklistItem>
					<ChecklistItem id="created">
						Catalogue created, with a name you are happy to keep forever
					</ChecklistItem>
					<ChecklistItem id="template">A starting layout chosen</ChecklistItem>
					<ChecklistItem id="heading">Catalogue heading written</ChecklistItem>
					<ChecklistItem id="sections">
						Sections named after real groups
					</ChecklistItem>
					<ChecklistItem id="theme">A theme picked</ChecklistItem>
					<ChecklistItem id="items">
						Example items replaced with your own
					</ChecklistItem>
					<ChecklistItem id="saved">Draft saved</ChecklistItem>
					<ChecklistItem id="preview">
						Checked in Preview on a phone
					</ChecklistItem>
					<ChecklistItem id="published">Published</ChecklistItem>
					<ChecklistItem id="shared">
						Link opened on a device that is not signed in
					</ChecklistItem>
				</Checklist>
			</ManualSection>

			<ManualSection kind="rules" title="If something is not working">
				<Rules>
					<Rule>
						<ButtonName>Publish</ButtonName> greyed out usually means no
						heading. The <PlaceName>+ Add Heading</PlaceName> placeholder does
						not count.
					</Rule>
					<Rule>
						Cannot add another section or item: you are at your plan&apos;s
						limit. Starter allows 5 sections and 15 items.
					</Rule>
					<Rule>
						Your changes not showing for customers: you saved but did not
						publish.
					</Rule>
					<Rule>
						<PlaceName>Catalogue Not Found</PlaceName> on your own link: the
						catalogue is still a draft, or it has been switched off.
					</Rule>
				</Rules>
			</ManualSection>
		</>
	);
}

const page: ManualPage = { Body, meta };
export default page;
