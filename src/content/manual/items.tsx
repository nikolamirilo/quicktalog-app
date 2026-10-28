import {
	ButtonName,
	FieldName,
	PlaceName,
	TabName,
} from "@/components/manual/Inline";
import { ManualSection } from "@/components/manual/ManualSection";
import { ManualTable } from "@/components/manual/ManualTable";
import { ManualText } from "@/components/manual/ManualText";
import { Messages } from "@/components/manual/Messages";
import { Option, Options } from "@/components/manual/Options";
import { Rule, Rules } from "@/components/manual/Rules";
import { FollowAlong } from "@/components/manual/Screen";
import { ItemScreen } from "@/components/manual/screens/ItemScreen";
import { Step, Steps } from "@/components/manual/Steps";
import type { ManualPage } from "./_types";

const meta = {
	slug: "items",
	group: "builder",
	title: "Add and edit items",
	inShort:
		"Put a dish, product or service into a section, with a price and a picture.",
	result: "An item your customers can read, tap and see the price of.",
	where: ["Builder", "An items section", "Add New Item"],
	before: [
		{ text: "You have an items section to put it in.", href: "sections" },
	],
	keywords: [
		"item",
		"price",
		"image",
		"photo",
		"description",
		"discount",
		"free",
		"unit",
	],
	synonyms: [
		"product",
		"dish",
		"service",
		"card",
		"add price",
		"upload photo",
		"sale",
	],
	related: ["sections", "limits", "publish"],
} satisfies ManualPage["meta"];

function Body() {
	return (
		<>
			<ManualSection kind="steps" title="Add an item">
				<FollowAlong screen={<ItemScreen />}>
					<Steps>
						<Step
							title={
								<>
									Select <ButtonName>Add New Item</ButtonName>
								</>
							}
						>
							<p>
								The tile sits at the end of the items in a section, or as the
								last slide if the section uses the carousel layout.
							</p>
						</Step>
						<Step spot={1} title="Type a name">
							<p>
								This is the only thing you must fill in. The save button stays
								switched off until you do.
							</p>
						</Step>
						<Step spot={3} title="Set the price">
							<p>
								Digits and up to two decimal places, with a full stop for the
								decimal point. The currency comes from the catalogue, so you do
								not type it.
							</p>
						</Step>
						<Step spot={5} title="Add a picture">
							<p>
								Drop a file on <TabName>Upload</TabName>, or switch to{" "}
								<TabName>URL</TabName> and paste a web address. One picture per
								item.
							</p>
						</Step>
						<Step
							done="The item appears in the section."
							spot={6}
							title={
								<>
									Select <ButtonName>Add item</ButtonName>
								</>
							}
						>
							<p>
								Or select{" "}
								<ButtonName variant="secondary">
									Add item &amp; add another
								</ButtonName>{" "}
								to keep the dialog open for the next one. A short{" "}
								<q>Item added</q> confirmation appears each time.
							</p>
						</Step>
						<Step
							done="A toast reads &quot;Catalogue saved successfully&quot;."
							title="Save your draft"
						/>
					</Steps>
				</FollowAlong>
			</ManualSection>

			<ManualSection kind="opts" title="Everything you can set on an item">
				<Options>
					<Option name="Name" required>
						<p>
							What the item is called, such as <FieldName>Pancakes</FieldName>.
							Shown on the card and used by your catalogue&apos;s search box.
						</p>
					</Option>
					<Option name="Description" optional>
						<p>
							A line or two about the item. Also searchable. On the cards it is
							shortened to two to four lines depending on the layout, and
							customers see all of it when they tap the item. Plain text only,
							so formatting and links are not possible here.
						</p>
					</Option>
					<Option name="Price" optional>
						<p>
							The amount, in the catalogue&apos;s currency. Whole amounts show
							without decimals, so <FieldName>10</FieldName> appears as 10 and{" "}
							<FieldName>9.5</FieldName> appears as 9.50.
						</p>
					</Option>
					<Option
						defaultValue="none"
						name="Price unit"
						values={["none", "kg", "g", "l", "ml", "pcs", "portion"]}
					>
						<p>
							What the price is per. Shown after the amount, as in{" "}
							<FieldName>12.00 / kg</FieldName>. Leave it at{" "}
							<FieldName>none</FieldName> for a flat price.
						</p>
					</Option>
					<Option name="Free" optional>
						<p>
							Marks the item as free. The card then shows the word{" "}
							<FieldName>Free</FieldName> instead of an amount, and the price
							and unit fields are greyed out.
						</p>
					</Option>
					<Option name="On sale" optional>
						<p>
							Shows the old price struck through next to the new one, with a red
							corner badge giving the percentage. Switching it on reveals a{" "}
							<FieldName>Sale price</FieldName> and a{" "}
							<FieldName>Percentage</FieldName> field. Fill in either one and
							Quicktalog works out the other.
						</p>
					</Option>
					<Option limit="Up to 50 MB" name="Image" optional>
						<p>
							A PNG, JPG or WebP picture. Quicktalog shrinks it in your browser
							before uploading, so a large photo straight off a phone is fine.
							SVG files are refused. An item with no picture of its own shows a
							plain placeholder on the card.
						</p>
					</Option>
				</Options>
			</ManualSection>

			<ManualSection kind="risk" title="An empty price reads as Free">
				<ManualText>
					<p>
						If you leave the price empty, Quicktalog stores zero, and a zero
						price appears to your customers as the word{" "}
						<FieldName>Free</FieldName>. Typing <FieldName>0</FieldName> and
						leaving the field does the same thing, and also ticks{" "}
						<FieldName>Free</FieldName> for you.
					</p>
					<p>
						There is no way to leave a price blank from the builder. If you do
						not want to show prices, say so in the description, or put the
						prices in a <PlaceName>Text</PlaceName> section instead.
					</p>
				</ManualText>
			</ManualSection>

			<ManualSection kind="steps" title="Edit, move or delete an item">
				<ManualText className="mb-4">
					<p>In the builder each item has a three dot menu on its card.</p>
				</ManualText>
				<ManualTable
					caption="What the item actions menu offers"
					columns={["Menu item", "What it does"]}
					rows={[
						[
							<PlaceName key="t">Edit item</PlaceName>,
							"Opens the same dialog with the item's details in it.",
						],
						[
							<PlaceName key="t">Move up</PlaceName>,
							"Swaps the item with the one before it.",
						],
						[
							<PlaceName key="t">Move down</PlaceName>,
							"Swaps the item with the one after it.",
						],
						[
							<PlaceName key="t">Move to section</PlaceName>,
							"Moves the item into another items section. Sections with no heading appear as Untitled section.",
						],
						[
							<PlaceName key="t">Delete item</PlaceName>,
							"Removes the item, after your browser asks you to confirm. There is no undo.",
						],
					]}
				/>
			</ManualSection>

			<ManualSection kind="rules" title="Good to know">
				<Rules>
					<Rule>
						Items count across the whole catalogue, not per section. A Starter
						plan allows 15 items however you spread them.
					</Rule>
					<Rule>
						A section shows its first 20 items, then a{" "}
						<ButtonName variant="secondary">Show more</ButtonName> button that
						adds 20 at a time.
					</Rule>
					<Rule>
						In a <FieldName>Text Only</FieldName> section the picture field is
						not shown at all, and any picture already on the item is not
						displayed.
					</Rule>
					<Rule>
						Tapping an item opens a larger view with the full description, and
						the picture can be enlarged from there.
					</Rule>
					<Rule>
						Switching <FieldName>On sale</FieldName> on and saving without
						filling in the two fields leaves the same price shown twice, once
						struck through, and no badge. Fill in the sale price or switch it
						back off.
					</Rule>
					<Rule>
						Entering a 100 percent discount, or a sale price of zero, turns the
						item into a free one.
					</Rule>
					<Rule>
						Items have no tags, badges or link field. The only badge is the sale
						percentage, and it is added for you.
					</Rule>
				</Rules>
			</ManualSection>

			<ManualSection kind="fix" title="Messages">
				<Messages
					messages={[
						{
							text: "SVG images aren't supported here. Please upload a PNG or JPG.",
							cause: "The file you chose is an SVG.",
							fix: "Export the picture as a PNG or JPG and try again.",
						},
						{
							text: "File is too large. Please select a smaller image",
							cause: "The file is over 50 MB.",
							fix: "Use a smaller photo. A normal phone photo is well under the limit.",
						},
						{
							text: "Please select a valid image file",
							cause: "The file is not a picture.",
							fix: "Choose a PNG, JPG or WebP file.",
						},
						{
							text: "Processed image size (1300KB) exceeds maximum allowed size of 1200KB",
							cause:
								"Quicktalog could not shrink the picture enough, which happens with very large or very detailed images.",
							fix: "Save the picture smaller, around 1200 pixels on the long side, and upload it again.",
						},
						{
							text: "Too many uploads, try again later",
							cause: "You have uploaded a lot of pictures in a short time.",
							fix: "Wait a minute and carry on.",
						},
						{
							text: "Invalid item data",
							cause:
								"A stored item has no name. This cannot be made from the builder.",
							fix: "Delete the item and add it again.",
						},
						{
							text: "Are you sure you want to delete this item?",
							cause:
								"You chose Delete item. This is your browser's own dialog.",
							fix: "Confirm, or cancel to keep it.",
						},
					]}
				/>
			</ManualSection>
		</>
	);
}

const page: ManualPage = { Body, meta };
export default page;
