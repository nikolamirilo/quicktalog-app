import { ManualSection } from "@/components/manual/ManualSection";
import { ManualTable } from "@/components/manual/ManualTable";
import { ManualText } from "@/components/manual/ManualText";
import { Note } from "@/components/manual/Note";
import { Rule, Rules } from "@/components/manual/Rules";
import type { ManualPage } from "./_types";

const meta = {
	slug: "limits",
	group: "reference",
	title: "Limits and rules",
	inShort: "Every number from this manual, gathered in one place.",
	keywords: ["limits", "maximum", "characters", "size", "rules", "quota"],
	synonyms: [
		"how many",
		"max",
		"cap",
		"allowance",
		"file size",
		"character limit",
	],
	related: ["plans", "troubleshooting", "glossary"],
} satisfies ManualPage["meta"];

function Body() {
	return (
		<>
			<ManualSection kind="opts" title="Your plan">
				<ManualTable
					caption="What each plan allows"
					columns={["", "Starter", "Basic", "Pro", "Growth", "Premium"]}
					rows={[
						["Catalogues", "1", "1", "6", "20", "50"],
						["Sections per catalogue", "5", "8", "15", "30", "50"],
						["Items per catalogue", "15", "30", "100", "200", "300"],
						["Page views a month", "500", "2,000", "5,000", "15,000", "40,000"],
						["AI credits a month", "15", "50", "150", "300", "600"],
					]}
				/>
				<Rules>
					<Rule>
						Every kind of section counts, including a text block or a divider.
						Your catalogue heading does not.
					</Rule>
					<Rule>Items count across the whole catalogue, not per section.</Rule>
					<Rule>
						Page views are counted across all your catalogues together, by UTC
						month. Your own visits and your previews both count.
					</Rule>
				</Rules>
			</ManualSection>

			<ManualSection kind="opts" title="How much you can type">
				<ManualTable
					caption="Character limits on the fields you fill in"
					columns={["Field", "Limit"]}
					rows={[
						[
							"Catalogue name",
							"60 characters, letters, numbers and spaces only",
						],
						["Catalogue heading", "100 characters of visible text"],
						["Search bar placeholder", "40 characters"],
						["Footer tagline", "120 characters"],
						["QR code frame text", "28 characters"],
						["Your name on your account", "1 to 80 characters"],
						["Support message", "5,000 characters"],
						["Support subject", "150 characters"],
						["Overlay emoji", "3 emoji"],
					]}
				/>
				<Note
					kind="info"
					title="Item names and descriptions have no limit in the builder"
				>
					<p>
						You can type as much as you like. Quick AI keeps itself to 120
						characters for a name and 600 for a description, which is a good
						guide for what reads well on a card.
					</p>
				</Note>
			</ManualSection>

			<ManualSection kind="opts" title="Pictures">
				<ManualTable
					caption="Image limits and formats"
					columns={["What", "Limit"]}
					rows={[
						["Formats", "PNG, JPG and WebP. SVG is refused."],
						[
							"File size",
							"Up to 50 MB, for item photos, your logo, a QR logo and a background",
						],
						["Pictures per item", "One"],
						[
							"Background photo",
							"At least 1600 pixels wide looks best. Quicktalog shrinks larger ones.",
						],
						[
							"How it is stored",
							"Quicktalog resizes and compresses in your browser before uploading.",
						],
					]}
				/>
			</ManualSection>

			<ManualSection kind="opts" title="Quick AI">
				<ManualTable
					caption="What Quick AI costs and what it will not exceed"
					columns={["What", "Number"]}
					rows={[
						["A question", "Free"],
						["A change", "2 credits"],
						["Each extra task in the same ask", "1 credit"],
						[
							"Each web page it reads",
							"2 credits, and not available on Starter",
						],
						["Pages it will read in one ask", "Up to 3, on paid plans"],
						["Reading photos you attach", "Free"],
						["Asks per minute", "10"],
						["Asks per hour", "60"],
						["How long one ask can run", "About a minute, then it is cut off"],
					]}
				/>
				<Note
					kind="warn"
					title="An ask that is cut off still costs its credits"
				>
					<p>
						Break a very large request into a few smaller ones rather than
						asking for everything at once.
					</p>
				</Note>
			</ManualSection>

			<ManualSection kind="opts" title="Design ranges">
				<ManualTable
					caption="The ranges on the design sliders"
					columns={["Setting", "Range", "Default"]}
					rows={[
						["Corner radius", "0 to 16px", "12px"],
						["Content font size", "Small, Medium, Large", "Medium"],
						["Shadow", "None, Low, Medium, High", "Low"],
						["Fonts to choose from", "19", "Inter"],
						["Themes to choose from", "7", "Monochrome"],
						["Glass opacity", "20 to 85%", "From the level you pick"],
						[
							"Glass frost",
							"0 to 40px, capped at 20 on phones",
							"From the level",
						],
						["Glass splay", "0 to 24px", "From the level"],
						["Background photo fade", "0 to 80%", "35%"],
						["Gradients to choose from", "12", "Oat milk"],
						["Divider spacing", "0 to 10rem", "2rem"],
						["Divider thickness", "1 to 10px", "1px"],
						["QR margin", "0 to 50px", "16px"],
						["Navbar logo width", "20 to 300px", "Around 160px"],
						["Footer logo width", "20 to 400px", "Around 160px"],
					]}
				/>
			</ManualSection>

			<ManualSection kind="opts" title="Counts and timings">
				<ManualTable
					caption="Other numbers worth knowing"
					columns={["What", "Number"]}
					rows={[
						["Social media links in your footer", "Up to 5"],
						["Partners in your footer", "Up to 3"],
						["Items shown before Show more", "20, then 20 at a time"],
						["Catalogues shown before Show More", "8"],
						["Days in the analytics table", "The last 10"],
						["Analytics ranges", "7, 30 or 90 days, on every plan"],
						["How long a saved draft is kept", "30 days from the last save"],
						["Name changes on your account", "5 an hour"],
						["Support messages", "5 an hour"],
						["Sign-up confirmation link", "24 hours"],
						["Password reset link", "1 hour"],
						["Delete lock on a new catalogue", "10 minutes"],
						["Dashboard totals rebuilt", "Once a day, early morning UTC"],
					]}
				/>
			</ManualSection>

			<ManualSection kind="rules" title="Things that are not possible">
				<ManualText className="mb-3">
					<p>These come up often enough to be worth stating plainly.</p>
				</ManualText>
				<Rules>
					<Rule>
						There is no undo in the builder, except rejecting a Quick AI change.
					</Rule>
					<Rule>There is no autosave. Saving is always something you do.</Rule>
					<Rule>
						There is no drag and drop. Reordering is one step at a time.
					</Rule>
					<Rule>
						A catalogue cannot be renamed, and its web address can never change.
					</Rule>
					<Rule>A catalogue cannot be password protected.</Rule>
					<Rule>
						Prices cannot be left blank. An empty price shows as Free.
					</Rule>
					<Rule>Items have no tags, badges or link of their own.</Rule>
					<Rule>
						There is no separate heading font. One setting covers both.
					</Rule>
					<Rule>
						There is no custom CSS. Custom visual sections are the nearest
						thing.
					</Rule>
					<Rule>
						QR code scans are not counted separately from ordinary visits.
					</Rule>
					<Rule>
						Analytics do not break down by item, country, device or referrer.
					</Rule>
					<Rule>There is no way to buy AI credits without changing plan.</Rule>
					<Rule>Your renewal date is not shown inside Quicktalog.</Rule>
				</Rules>
			</ManualSection>
		</>
	);
}

const page: ManualPage = { Body, meta };
export default page;
