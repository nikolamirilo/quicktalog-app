import { ButtonName, PlaceName } from "@/components/manual/Inline";
import { ManualSection } from "@/components/manual/ManualSection";
import { ManualTable } from "@/components/manual/ManualTable";
import { ManualText } from "@/components/manual/ManualText";
import { Messages } from "@/components/manual/Messages";
import { Note } from "@/components/manual/Note";
import { Rule, Rules } from "@/components/manual/Rules";
import { Step, Steps } from "@/components/manual/Steps";
import { ActionsMenuScreen } from "@/components/manual/screens/ActionsMenuScreen";
import type { ManualPage } from "./_types";

const meta = {
	slug: "share-link",
	group: "share",
	title: "Share the link",
	inShort: "Find your catalogue's address and send it to customers.",
	result: "A link in your hand that opens your catalogue.",
	where: ["Dashboard", "A catalogue card", "Share"],
	before: [{ text: "Your catalogue is published.", href: "publish" }],
	keywords: ["share", "link", "url", "copy", "embed", "website", "social"],
	synonyms: [
		"send",
		"address",
		"web address",
		"put on my website",
		"whatsapp",
		"instagram bio",
	],
	related: ["qr-code", "publish", "analytics"],
} satisfies ManualPage["meta"];

function Body() {
	return (
		<>
			<ManualSection kind="info" title="Your address">
				<ManualText>
					<p>
						Every catalogue lives at{" "}
						<code>quicktalog.app/catalogues/your-catalogue-name</code>, built
						from the name you chose when you created it. Spaces became hyphens
						and capitals became lowercase.
					</p>
					<p>
						It never changes. That is the point: you can print it, put it in a
						window, or add it to your social media profile and it keeps working.
					</p>
				</ManualText>
			</ManualSection>

			<ManualSection kind="steps" title="Copy the link">
				<ActionsMenuScreen />

				<Steps>
					<Step title="Open the catalogue card's actions menu on the dashboard">
						<p>The three dots beside the catalogue name.</p>
					</Step>
					<Step
						done="The menu item turns green and reads Link Copied."
						title={
							<>
								Choose <PlaceName>Share</PlaceName>
							</>
						}
					>
						<p>
							The link is now on your clipboard. The menu stays open so you can
							do something else.
						</p>
					</Step>
				</Steps>
				<Note kind="warn" title="Share works even when the catalogue is off">
					<p>
						Copying the link does not check whether the catalogue is published.
						If you share the link of a draft or an inactive catalogue, whoever
						opens it sees <PlaceName>Catalogue Not Found</PlaceName>. Check the
						status pill on the card first.
					</p>
				</Note>
			</ManualSection>

			<ManualSection kind="info" title="Other ways to share">
				<ManualTable
					caption="Where to find your link and how else to use it"
					columns={["Way", "Where it is", "What you get"]}
					rows={[
						[
							<PlaceName key="t">Share</PlaceName>,
							"The actions menu on the dashboard card.",
							"The plain link, copied, ready to paste anywhere.",
						],
						[
							<PlaceName key="t">Direct link</PlaceName>,
							"The Congratulations dialog the first time you publish.",
							"The same link, with a Copy button beside it.",
						],
						[
							<ButtonName key="t">View Catalogue</ButtonName>,
							"The card of an active catalogue.",
							"Opens your live page so you can check it and copy from the address bar.",
						],
						[
							<PlaceName key="t">QR Code</PlaceName>,
							"The actions menu, and the publish dialog.",
							"A square code for print. See the QR code page.",
						],
						[
							<PlaceName key="t">Embed</PlaceName>,
							"The actions menu.",
							"Downloads a complete HTML file with your catalogue in a full screen frame.",
						],
					]}
				/>
				<Note kind="info" title="Embed is a whole file, not a snippet">
					<p>
						The downloaded file is a finished page. If your website builder asks
						for a short piece of code to paste in, this is not it. Upload the
						file to your own hosting, or simply link to your catalogue instead.
					</p>
				</Note>
			</ManualSection>

			<ManualSection kind="rules" title="Good to know">
				<Rules>
					<Rule>
						Changes you publish reach everyone with the link straight away.
						There is nothing to resend.
					</Rule>
					<Rule>
						Pasting the link into a chat app or a social post shows a preview
						card with your catalogue&apos;s name and description. Set those in
						the <PlaceName>General</PlaceName> tab of the editor panel.
					</Rule>
					<Rule>
						The preview address, the one ending in <code>/preview</code>, only
						works for you. Sending it to someone else sends them to the sign in
						page.
					</Rule>
					<Rule>
						Your own visits count in your numbers, so opening your own catalogue
						to check it will show up in your analytics.
					</Rule>
					<Rule>
						There is no way to password protect a catalogue. Anyone with the
						link can open it.
					</Rule>
				</Rules>
			</ManualSection>

			<ManualSection kind="fix" title="Messages">
				<Messages
					messages={[
						{
							text: "Catalogue Not Found",
							cause:
								"The catalogue at that address is a draft, is switched off, or does not exist.",
							fix: "Publish it, or switch it back on with Change Status then Activate.",
						},
						{
							text: "Link Copied",
							cause: "You chose Share and the link reached your clipboard.",
							fix: "Paste it where you need it.",
						},
					]}
				/>
			</ManualSection>
		</>
	);
}

const page: ManualPage = { Body, meta };
export default page;
