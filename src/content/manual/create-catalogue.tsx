import {
	ButtonName,
	FieldName,
	Message,
	PlaceName,
} from "@/components/manual/Inline";
import { ManualSection } from "@/components/manual/ManualSection";
import { ManualTable } from "@/components/manual/ManualTable";
import { ManualText } from "@/components/manual/ManualText";
import { Messages } from "@/components/manual/Messages";
import { Note } from "@/components/manual/Note";
import { Option, Options } from "@/components/manual/Options";
import { Rule, Rules } from "@/components/manual/Rules";
import { FollowAlong } from "@/components/manual/Screen";
import { CreateCatalogueScreen } from "@/components/manual/screens/CreateCatalogueScreen";
import { Step, Steps } from "@/components/manual/Steps";
import type { ManualPage } from "./_types";

const meta = {
	slug: "create-catalogue",
	group: "catalogues",
	title: "Create a catalogue",
	inShort: "Make a new, empty catalogue and choose how it starts.",
	result:
		"A draft catalogue with its own web address, open in the builder, ready for your content.",
	where: ["Dashboard", "The round + button"],
	before: [
		{ text: "You are signed in and on the dashboard.", href: "dashboard" },
		{
			text: "You have room on your plan. Starter and Basic allow one catalogue.",
			href: "plans",
		},
	],
	keywords: [
		"create",
		"new catalogue",
		"template",
		"slug",
		"url",
		"language",
		"currency",
	],
	synonyms: [
		"add catalogue",
		"start a catalogue",
		"new menu",
		"set up",
		"make a catalog",
	],
	related: ["builder-basics", "manage-catalogues", "plans"],
} satisfies ManualPage["meta"];

function Body() {
	return (
		<>
			<ManualSection kind="info" title="How it works">
				<ManualText>
					<p>
						Creating a catalogue takes two short steps. First you answer four
						questions in a dialog, which creates the catalogue and gives it its
						web address. Then the builder opens and offers you a starting
						layout.
					</p>
					<p>
						The new catalogue is a draft. Nobody else can open it until you
						publish.
					</p>
				</ManualText>
			</ManualSection>

			<ManualSection kind="steps" title="Create the catalogue">
				<FollowAlong screen={<CreateCatalogueScreen />}>
					<Steps>
						<Step
							spot={6}
							title={
								<>
									Select the round <ButtonName>+</ButtonName> button in the
									bottom right of the dashboard
								</>
							}
						>
							<p>
								Its tooltip reads <PlaceName>Create catalogue</PlaceName>. The{" "}
								<PlaceName>Create a Catalog</PlaceName> dialog opens.
							</p>
						</Step>
						<Step
							done="A green line reads &quot;Great! This name is available.&quot;"
							spot={1}
							title="Type a name"
						>
							<p>
								Letters, numbers and spaces only, up to 60 characters. As you
								type, Quicktalog checks whether the name is free and shows the
								address you will get.
							</p>
						</Step>
						<Step spot={2} title="Choose the language and the currency">
							<p>
								Both have a search box. The language starts at{" "}
								<PlaceName>English</PlaceName> and the currency at{" "}
								<PlaceName>Euro</PlaceName>.
							</p>
						</Step>
						<Step spot={4} title="Choose your business type">
							<p>
								This is the only answer with nothing filled in, so the{" "}
								<ButtonName>Create Catalog</ButtonName> button stays switched
								off until you pick one.
							</p>
						</Step>
						<Step
							done="A toast confirms the catalogue was created, and the builder opens."
							title={
								<>
									Select <ButtonName>Create Catalog</ButtonName>
								</>
							}
						>
							<p>
								The button reads <ButtonName>Creating...</ButtonName> while it
								works.
							</p>
						</Step>
					</Steps>
				</FollowAlong>
			</ManualSection>

			<ManualSection kind="opts" title="What the dialog asks for">
				<Options>
					<Option limit="Max 60 characters" name="Catalogue Name" required>
						<p>
							The name of the catalogue, and the basis of its web address.
							Letters, numbers and spaces only. Names are shared across all of
							Quicktalog, so a name someone else already uses is refused.
						</p>
					</Option>
					<Option defaultValue="English" name="Language">
						<p>
							The language of your catalogue. It is also the language Quick AI
							uses when it reads text out of photos you attach, so set it to the
							language your prices and dishes are written in.
						</p>
					</Option>
					<Option defaultValue="Euro" name="Currency">
						<p>
							The currency your prices appear in. There are 156 to choose from,
							listed by full name. You can also type a three letter code such as{" "}
							<FieldName>USD</FieldName> to find one.
						</p>
					</Option>
					<Option
						name="Business Type"
						required
						values={[
							"Food & Beverage",
							"Beauty & Wellness",
							"Health & Fitness",
							"Retail & E-commerce",
							"Professional Services",
							"Home & Trades",
							"Events & Hospitality",
							"Education & Training",
							"Automotive",
							"Real Estate",
							"Other",
						]}
					>
						<p>
							Your line of business. It only changes the tone Quick AI writes
							in. It does not change your layout, your theme or anything your
							customers see.
						</p>
					</Option>
				</Options>
			</ManualSection>

			<ManualSection kind="risk" title="Your web address is permanent">
				<ManualText>
					<p>
						The name you type becomes the address of your catalogue, in
						lowercase with spaces turned into hyphens.{" "}
						<FieldName>Burger House</FieldName> becomes{" "}
						<code>quicktalog.app/catalogues/burger-house</code>.
					</p>
					<p>
						<strong>
							There is no way to rename a catalogue or change its address
							afterwards.
						</strong>{" "}
						If you need a different address, duplicate the catalogue under the
						new name and delete the old one. Any QR code you have already
						printed points at the old address, so get the name right before you
						print anything.
					</p>
				</ManualText>
			</ManualSection>

			<ManualSection kind="steps" title="Choose a starting layout">
				<ManualText className="mb-4">
					<p>
						The <PlaceName>Choose a Template</PlaceName> dialog opens by itself
						in the builder because the catalogue is empty. Pick one and select{" "}
						<ButtonName>Select template</ButtonName>. You can reopen it later
						from the <PlaceName>Templates</PlaceName> control in the builder.
					</p>
				</ManualText>
				<ManualTable
					caption="The three ways a new catalogue can start"
					columns={["Choice", "What you get"]}
					rows={[
						[
							<PlaceName key="t">Quick Start</PlaceName>,
							"Two sections with three example items each, and all prices set to 0. Chosen for you by default.",
						],
						[
							<PlaceName key="t">Standard Catalog</PlaceName>,
							"Five sections and fifteen example items with example prices. The card says four categories, but there are five sections.",
						],
						[
							<PlaceName key="t">Start from Scratch</PlaceName>,
							"An empty catalogue. You add every section yourself.",
						],
					]}
				/>
				<Note
					kind="warn"
					title="Standard Catalog fills a Starter plan completely"
				>
					<p>
						Its five sections and fifteen items are exactly what the Starter
						plan allows, so you will not be able to add anything else without
						deleting something first.
					</p>
				</Note>
				<Note kind="info" title="Templates bring content, not a look">
					<p>
						Every new catalogue gets the same starting theme whichever template
						you choose. Changing the look is a separate job in the{" "}
						<PlaceName>Appearance</PlaceName> tab.
					</p>
				</Note>
			</ManualSection>

			<ManualSection kind="rules" title="Good to know">
				<Rules>
					<Rule>
						Applying a template replaces the content already in the catalogue.
						If there is any, Quicktalog asks first with{" "}
						<PlaceName>Change template?</PlaceName> and offers{" "}
						<ButtonName variant="secondary">Save &amp; continue</ButtonName>.
					</Rule>
					<Rule>
						The toast after creating shows the address, not the name you typed.
						A catalogue called <FieldName>Burger House</FieldName> is confirmed
						as <code>burger-house</code>.
					</Rule>
					<Rule>
						Applying a template does not save anything. Nothing in the builder
						saves by itself.
					</Rule>
					<Rule>
						<ButtonName>Publish</ButtonName> and{" "}
						<ButtonName variant="secondary">Preview</ButtonName> stay switched
						off until you have given the catalogue a heading, because a brand
						new catalogue only shows a <PlaceName>+ Add Heading</PlaceName>
						placeholder.
					</Rule>
					<Rule>
						Signed out, the button sends you to the sign up page instead of
						opening the dialog.
					</Rule>
				</Rules>
			</ManualSection>

			<ManualSection kind="fix" title="Messages">
				<Messages
					messages={[
						{
							text: "Name must only contain letters, numbers, and spaces (no special characters).",
							cause:
								"The name has punctuation, an ampersand, an apostrophe or another symbol in it.",
							fix: "Take the symbols out. You can use them freely in the heading your customers read, just not in the name.",
						},
						{
							text: "Name cannot be just spaces.",
							cause: "The field has only spaces in it.",
							fix: "Type some letters or numbers.",
						},
						{
							text: "This name is already in use. Please choose a different name.",
							cause:
								"Another Quicktalog catalogue already has that address, possibly someone else's.",
							fix: "Try a longer or more specific name, such as adding your town.",
						},
						{
							text: "A catalogue with this name already exists",
							cause:
								"The name was taken between your typing it and selecting Create Catalog.",
							fix: "Change the name and try again. The dialog stays open with your other answers.",
						},
						{
							text: "You have reached the catalogue limit of your plan",
							cause: "You already have as many catalogues as your plan allows.",
							fix: "Delete one you do not need, or move to a bigger plan.",
						},
						{
							text: "An unexpected error occurred",
							cause:
								"The request did not reach Quicktalog, usually the connection.",
							fix: "Try again. Your answers are still in the dialog.",
						},
					]}
				/>
				<Note kind="info" title="A quiet name check">
					<p>
						If the availability check itself fails, no hint appears at all and
						the dialog lets you carry on. The answer then comes from the server
						when you select <ButtonName>Create Catalog</ButtonName>. Seeing no{" "}
						<Message>Great! This name is available.</Message> line does not mean
						the name is taken.
					</p>
				</Note>
			</ManualSection>
		</>
	);
}

const page: ManualPage = { Body, meta };
export default page;
