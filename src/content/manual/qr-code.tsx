import {
	ButtonName,
	FieldName,
	PlaceName,
	TabName,
} from "@/components/manual/Inline";
import { ManualSection } from "@/components/manual/ManualSection";
import { Messages } from "@/components/manual/Messages";
import { Note } from "@/components/manual/Note";
import { Option, Options } from "@/components/manual/Options";
import { Rule, Rules } from "@/components/manual/Rules";
import { Step, Steps } from "@/components/manual/Steps";
import { QrEditorScreen } from "@/components/manual/screens/QrEditorScreen";
import type { ManualPage } from "./_types";

const meta = {
	slug: "qr-code",
	group: "share",
	title: "Make a QR code",
	inShort:
		"Design a QR code for your catalogue and download it for print or screen.",
	result: "A PNG, SVG or JPEG file of your QR code, in your own colours.",
	where: ["Dashboard", "A catalogue card", "QR Code"],
	before: [
		{ text: "You have a catalogue. It does not have to be published yet." },
	],
	keywords: [
		"qr",
		"qr code",
		"download",
		"print",
		"png",
		"svg",
		"jpeg",
		"logo",
		"frame text",
	],
	synonyms: ["scan code", "table code", "poster", "sticker", "menu code"],
	related: ["share-link", "publish"],
} satisfies ManualPage["meta"];

function Body() {
	return (
		<>
			<ManualSection kind="steps" title="Design and download a code">
				<QrEditorScreen />

				<Steps>
					<Step title="Open the catalogue card's actions menu on the dashboard" />
					<Step
						done="The QR editor opens with a large preview and four tabs of controls."
						title={
							<>
								Choose <PlaceName>QR Code</PlaceName>
							</>
						}
					/>
					<Step title="Work through the tabs">
						<p>
							<TabName>Colors</TabName> for the colours,{" "}
							<TabName>Style</TabName> for the shapes, <TabName>Logo</TabName>{" "}
							to put your logo in the middle, and <TabName>Settings</TabName>{" "}
							for the technical parts and the label under the code.
						</p>
					</Step>
					<Step
						done="Your design is stored, so it is there next time you come back."
						title="Save your design"
					>
						<p>
							Leaving without saving opens a dialog headed{" "}
							<PlaceName>Unsaved Changes</PlaceName> offering{" "}
							<ButtonName variant="secondary">Stay</ButtonName> and{" "}
							<ButtonName>Leave</ButtonName>.
						</p>
					</Step>
					<Step
						done='A toast reads "QR code downloaded as PNG." and the file is in your downloads.'
						title={
							<>
								Select <ButtonName>Download PNG</ButtonName>
							</>
						}
					>
						<p>
							<ButtonName variant="secondary">SVG</ButtonName> and{" "}
							<ButtonName variant="secondary">JPEG</ButtonName> sit beside it.
							The file is named after your catalogue, for example{" "}
							<code>burger-house-qr.png</code>.
						</p>
					</Step>
					<Step title="Scan it yourself before you print it">
						<p>
							Point your own phone at the code on screen. This catches a code
							that is too low in contrast, or a logo that covers too much of it.
						</p>
					</Step>
				</Steps>
			</ManualSection>

			<ManualSection kind="opts" title="Colors">
				<Options>
					<Option
						name="Color presets"
						values={["Ink & amber", "Coffee", "Navy", "Organic", "Classic"]}
					>
						<p>
							Five ready made combinations. Selecting one sets all four colours
							below.
						</p>
					</Option>
					<Option defaultValue="#16140F" name="QR Dots">
						<p>The pattern itself, the part a scanner reads.</p>
					</Option>
					<Option defaultValue="#FFFFFF" name="Background">
						<p>Behind the pattern.</p>
					</Option>
					<Option defaultValue="#16140F" name="Corner Frames">
						<p>The outer ring of the three square markers.</p>
					</Option>
					<Option defaultValue="#C77F00" name="Corner Dots">
						<p>The middle of those three markers.</p>
					</Option>
				</Options>
				<Note kind="warn" title="Watch the contrast pill">
					<p>
						Under the colours a pill reads <q>Contrast 4.2:1 &middot; Good</q>{" "}
						or <q>Contrast 1.8:1 &middot; Low</q>. When it is low, a warning
						appears saying your code may be hard to scan. Pale codes on pale
						backgrounds are the usual cause. Dark dots on a light background
						always work best.
					</p>
				</Note>
			</ManualSection>

			<ManualSection kind="opts" title="Style, Logo and Settings">
				<Options>
					<Option
						defaultValue="Rounded"
						name="Dots pattern"
						values={["Square", "Dots", "Rounded", "Extra", "Classy", "Classy+"]}
					>
						<p>The shape of each dot in the pattern.</p>
					</Option>
					<Option
						defaultValue="Rounded"
						name="Corner frames"
						values={["Square", "Dot", "Rounded"]}
					>
						<p>The shape of the three corner markers.</p>
					</Option>
					<Option
						defaultValue="Dot"
						name="Corner dots"
						values={["Square", "Dot"]}
					>
						<p>The shape inside those markers.</p>
					</Option>
					<Option limit="Up to 50 MB" name="Logo" optional>
						<p>
							A PNG, JPG or WebP picture placed in the centre. Keep it simple
							and small. A big or busy logo covers the pattern and stops the
							code scanning.
						</p>
					</Option>
					<Option
						defaultValue="Quartile, 25%"
						name="Error correction level"
						values={[
							"Low · 7%",
							"Medium · 15%",
							"Quartile · 25%",
							"High · 30%",
						]}
					>
						<p>
							How much of the code can be damaged or covered and still be read.
							Higher is more forgiving, which matters for a printed code or one
							with a logo on it, but makes the pattern denser.
						</p>
					</Option>
					<Option defaultValue="16px" limit="0 to 50px" name="Margin (padding)">
						<p>
							The quiet space around the code. Scanners need some. Do not set it
							to zero for anything you print.
						</p>
					</Option>
					<Option defaultValue="Off" name="Show frame text">
						<p>
							Adds a short label in a bar under the code, so people know what
							they are pointing at.
						</p>
					</Option>
					<Option defaultValue="Scan it!" limit="Max 28 characters" name="Text">
						<p>
							The label itself, such as <FieldName>Our menu</FieldName>. Greyed
							out until the switch above is on. Leaving it blank prints nothing
							even with the switch on.
						</p>
					</Option>
				</Options>
			</ManualSection>

			<ManualSection kind="rules" title="Good to know">
				<Rules>
					<Rule>The QR editor is on every plan, including the free one.</Rule>
					<Rule>
						The code always points at your catalogue, and that cannot be
						changed. The editor says so above the preview.
					</Rule>
					<Rule>
						Because your address never changes, a printed code keeps working
						forever, even after you change what is in the catalogue.
					</Rule>
					<Rule>
						The code still works if the catalogue is switched off, but it will
						show <PlaceName>Catalogue Not Found</PlaceName> to whoever scans it.
					</Rule>
					<Rule>
						A new design is 300 pixels square. For a large poster, download the{" "}
						<ButtonName variant="secondary">SVG</ButtonName>, which stays sharp
						at any size.
					</Rule>
					<Rule>
						The SVG does not carry the font with it, so frame text in an SVG may
						look different on another computer. Use the PNG when the label
						matters.
					</Rule>
					<Rule>
						The QR code offered in the publish dialog is always the standard
						design and has no frame text. Come to the QR editor for your own
						design.
					</Rule>
					<Rule>
						Quicktalog does not count scans. Views from a scan appear in your
						analytics as ordinary visits.
					</Rule>
				</Rules>
			</ManualSection>

			<ManualSection kind="fix" title="Messages">
				<Messages
					messages={[
						{
							text: "Use a 6-digit hex colour like #16140F.",
							cause:
								"The colour you typed is not a complete six digit hex code.",
							fix: "Type all six characters, or use the colour swatch beside the field.",
						},
						{
							text: "Low Contrast Warning",
							cause:
								"Your dot colour and background colour are too close together.",
							fix: "Make the dots darker or the background lighter until the pill reads Good.",
						},
						{
							text: "The download failed. Please try again.",
							cause: "The file could not be built.",
							fix: "Try again, or try a different format.",
						},
						{
							text: "SVG images aren't supported here. Please upload a PNG or JPG.",
							cause: "You tried to use an SVG as the centre logo.",
							fix: "Export your logo as a PNG with a transparent background.",
						},
					]}
				/>
			</ManualSection>
		</>
	);
}

const page: ManualPage = { Body, meta };
export default page;
