import {
	BarChart3,
	CreditCard,
	LayoutGrid,
	Palette,
	PencilRuler,
	Rocket,
	Share2,
	Smartphone,
	Sparkles,
} from "lucide-react";

import { ButtonName } from "@/components/manual/Inline";
import { Flow } from "@/components/manual/Flow";
import { CardLink, Cards, GoalCard } from "@/components/manual/ManualCards";
import { ManualIndex } from "@/components/manual/ManualIndex";
import { ManualSection } from "@/components/manual/ManualSection";
import { ManualText } from "@/components/manual/ManualText";
import { Note } from "@/components/manual/Note";
import { Rule, Rules } from "@/components/manual/Rules";
import { SectionLegend } from "@/components/manual/SectionLegend";
import { Step, Steps } from "@/components/manual/Steps";
import { Term } from "@/components/manual/Term";
import { manualHref } from "@/lib/content/manual";
import type { ManualPage } from "./_types";

const meta = {
	slug: "welcome",
	group: "get-started",
	title: "Welcome to Quicktalog",
	inShort:
		"Find out what Quicktalog does, and where everything in this manual lives.",
	keywords: ["manual", "help", "user guide", "quicktalog"],
	synonyms: ["start", "introduction", "what is quicktalog", "documentation"],
	related: ["tour", "quickstart"],
} satisfies ManualPage["meta"];

function Body() {
	return (
		<>
			<ManualSection kind="info" title="What Quicktalog does">
				<ManualText>
					<p>
						Quicktalog turns your products, services or menu into a{" "}
						<Term name="catalogue" />: one web page at its own address that you
						can share with a link or a printed QR code. Your customers open it
						in a browser. There is nothing for them to install.
					</p>
					<p>
						You build a catalogue by adding sections and filling them with
						items. You can write everything yourself, start from a ready made
						layout, or ask <Term name="builder" />
						&apos;s assistant to draft it for you. When it looks right, you
						publish it. Until then only you can see it.
					</p>
				</ManualText>
			</ManualSection>

			<ManualSection kind="info" title="How a catalogue reaches a customer">
				<Flow
					caption="Save keeps your work in the draft. Only Publish moves it to the live page."
					nodes={[
						{
							body: (
								<>
									You build it in the builder.{" "}
									<ButtonName variant="secondary">Save</ButtonName> keeps it
									private.
								</>
							),
							icon: PencilRuler,
							title: "Your draft",
						},
						{
							body: (
								<>
									<ButtonName>Publish</ButtonName> copies the draft onto your
									public address.
								</>
							),
							icon: Rocket,
							title: "Your live page",
							via: "Publish",
						},
						{
							body: "They open your link, or scan your QR code, in a browser.",
							icon: Smartphone,
							title: "Your customer",
							via: "Link or QR",
						},
					]}
				/>
				<Note kind="warn" title="This is the thing people get wrong">
					<p>
						Saving and publishing are different. If a change is not showing for
						your customers, you almost certainly saved without publishing.
					</p>
				</Note>
			</ManualSection>

			<ManualSection kind="steps" title="If you are new, start here">
				<Steps>
					<Step
						done="You can name the three screens you will spend your time in."
						title="Read the tour"
					>
						<p>
							Two minutes on the dashboard, the builder and the published page.
						</p>
					</Step>
					<Step
						done="You have a live catalogue with a link you can send to someone."
						title="Follow the quickstart"
					>
						<p>
							It takes you from an empty account to a published catalogue, and
							keeps your place if you stop halfway.
						</p>
					</Step>
					<Step title="Come back to the module you need">
						<p>
							After that, use the list on the left or the search box. Every page
							covers one job.
						</p>
					</Step>
				</Steps>
			</ManualSection>

			<ManualSection kind="link" title="What do you want to do?">
				<Cards>
					<GoalCard
						goal="Put my menu or price list online"
						href={manualHref("quickstart")}
					>
						The whole job, from a new account to a link you can share.
					</GoalCard>
					<GoalCard
						goal="Change a price or add a new item"
						href={manualHref("items")}
					>
						Edit what is inside a section, then publish the change.
					</GoalCard>
					<GoalCard
						goal="Print a QR code for my counter"
						href={manualHref("qr-code")}
					>
						Design the code, then download it as a PNG, SVG or JPEG.
					</GoalCard>
					<GoalCard
						goal="See how many people looked"
						href={manualHref("analytics")}
					>
						Views, visitors and your busiest day, per catalogue.
					</GoalCard>
				</Cards>
			</ManualSection>

			<ManualSection kind="link" title="The modules">
				<Cards columns={3}>
					<CardLink
						count={3}
						href={manualHref("dashboard")}
						icon={LayoutGrid}
						kind="opts"
						title="Your catalogues"
					>
						The dashboard, creating a catalogue, and looking after the ones you
						have.
					</CardLink>
					<CardLink
						count={4}
						href={manualHref("builder-basics")}
						icon={PencilRuler}
						kind="steps"
						title="Build a catalogue"
					>
						The builder, sections, items, and the other kinds of content.
					</CardLink>
					<CardLink
						count={2}
						href={manualHref("quick-ai")}
						icon={Sparkles}
						kind="example"
						title="Quick AI"
					>
						Ask for a change in plain words, then accept or reject it.
					</CardLink>
					<CardLink
						count={3}
						href={manualHref("themes")}
						icon={Palette}
						kind="info"
						title="Design"
					>
						Themes, colours, fonts, the header and footer, and backgrounds.
					</CardLink>
					<CardLink
						count={3}
						href={manualHref("publish")}
						icon={Share2}
						kind="rules"
						title="Share and publish"
					>
						Going live, sharing the link, switching it off, and QR codes.
					</CardLink>
					<CardLink
						count={1}
						href={manualHref("analytics")}
						icon={BarChart3}
						kind="opts"
						title="Results"
					>
						What the numbers mean and what they leave out.
					</CardLink>
					<CardLink
						count={3}
						href={manualHref("plans")}
						icon={CreditCard}
						kind="rules"
						title="Account and plans"
					>
						Your details, what each plan includes, and changing or cancelling.
					</CardLink>
				</Cards>
			</ManualSection>

			<ManualSection kind="link" title="Every page">
				<ManualText className="mb-4">
					<p>
						Twenty-five pages in all. Nothing here is more than one tap away.
					</p>
				</ManualText>
				<ManualIndex />
			</ManualSection>

			<ManualSection kind="info" title="How these pages work">
				<ManualText className="mb-4">
					<p>
						Every page starts with what it helps you do and what you end up
						with. A <strong>Where</strong> bar shows the way to the screen
						through the product. The coloured icon beside each heading tells you
						what kind of section it is.
					</p>
				</ManualText>
				<SectionLegend />
				<ManualText className="mt-4">
					<p>
						In the text, the product&apos;s own words are styled so you can
						match them to your screen. A button looks like{" "}
						<ButtonName>Publish</ButtonName>, a place in the product looks like{" "}
						a shaded word, a setting name is in bold, and a message is quoted
						exactly as the product writes it.
					</p>
				</ManualText>
				<Rules>
					<Rule>
						Pictures of screens are drawings, not photographs. They use the real
						labels and the real layout, with made up example data.
					</Rule>
					<Rule>
						Hover a numbered circle to light up the matching spot on the screen
						above it.
					</Rule>
					<Rule>
						Press <ButtonName variant="secondary">/</ButtonName> anywhere to
						search.
					</Rule>
				</Rules>
			</ManualSection>
		</>
	);
}

const page: ManualPage = { Body, meta };
export default page;
