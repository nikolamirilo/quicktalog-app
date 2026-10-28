import { FieldName, PlaceName, TabName } from "@/components/manual/Inline";
import { ManualSection } from "@/components/manual/ManualSection";
import { ManualText } from "@/components/manual/ManualText";
import { Messages } from "@/components/manual/Messages";
import { Note } from "@/components/manual/Note";
import { Option, Options } from "@/components/manual/Options";
import { Rule, Rules } from "@/components/manual/Rules";
import { Step, Steps } from "@/components/manual/Steps";
import { BackgroundGlassScreen } from "@/components/manual/screens/BackgroundGlassScreen";
import type { ManualPage } from "./_types";

const meta = {
	slug: "background-and-glass",
	group: "design",
	title: "Background, glass effect and overlay",
	inShort:
		"Put a photo, gradient or colour behind your catalogue, and make the surfaces see through.",
	result:
		"A catalogue with your own backdrop and, if you want it, a frosted glass look.",
	where: ["Builder", "Editor", "Appearance"],
	before: [{ text: "You are on a Pro plan or higher.", href: "plans" }],
	badges: ["Pro and up"],
	keywords: [
		"background",
		"photo",
		"gradient",
		"colour",
		"glass",
		"blur",
		"overlay",
		"emoji",
	],
	synonyms: [
		"wallpaper",
		"backdrop",
		"frosted",
		"transparency",
		"snow",
		"confetti",
	],
	related: ["themes", "catalogue-chrome", "plans"],
} satisfies ManualPage["meta"];

function Body() {
	return (
		<>
			<ManualSection kind="info" title="What this group does">
				<ManualText>
					<p>
						Your theme sets the colours of your page, cards and text. These
						three settings sit on top of it: a backdrop behind everything, a see
						through treatment for the surfaces in front of it, and a playful
						overlay of falling emoji.
					</p>
					<p>
						All three need a Pro plan or higher. They are in the{" "}
						<TabName>Appearance</TabName> tab of the editor panel.
					</p>
				</ManualText>
			</ManualSection>

			<ManualSection kind="steps" title="Add a background">
				<Steps>
					<Step
						title={
							<>
								Switch on <FieldName>Customize background</FieldName>
							</>
						}
					/>
					<Step title="Choose a type">
						<p>
							<FieldName>Photo</FieldName>, <FieldName>Gradient</FieldName> or{" "}
							<FieldName>Colour</FieldName>. Each type remembers its own choice,
							so you can switch between them without losing your picks.
						</p>
					</Step>
					<Step
						done="The backdrop appears behind your catalogue straight away in the builder."
						title="Set it up"
					>
						<p>
							A gradient is one of twelve tiles. A colour is a hex code, a
							native colour picker or one of twelve quick picks. A photo is
							uploaded, with a <FieldName>Fade</FieldName> slider to soften it.
						</p>
					</Step>
				</Steps>
				<BackgroundGlassScreen />

				<Options>
					<Option
						defaultValue="Gradient"
						name="Background type"
						values={["Photo", "Gradient", "Colour"]}
					>
						<p>Which kind of backdrop to use.</p>
					</Option>
					<Option
						defaultValue="Oat milk"
						limit="12 to choose from"
						name="Gradient"
					>
						<p>
							Soft two colour washes: Oat milk, Peach glow, Sunset, Sage,
							Meadow, Sea glass, Morning sky, Lavender, Orchid, Blush, Stone and
							Mist.
						</p>
					</Option>
					<Option defaultValue="#f6f1e9" name="Colour">
						<p>
							A flat colour. Must be a full six digit hex code. The quick picks
							include four dark options for use with a dark theme.
						</p>
					</Option>
					<Option limit="Up to 50 MB" name="Photo">
						<p>
							A PNG, JPG or WebP image. Landscape photos at least 1600 pixels
							wide look best, and Quicktalog shrinks anything larger in your
							browser. SVG files are refused.
						</p>
					</Option>
					<Option defaultValue="35%" limit="0 to 80%" name="Fade">
						<p>
							Blends the photo into your theme&apos;s background colour so text
							stays readable. Higher means more theme colour and less photo.
							Only shown for a photo.
						</p>
					</Option>
				</Options>
				<Note kind="warn" title="Every gradient is light">
					<p>
						All twelve gradients are pale, so one behind a dark theme such as{" "}
						<PlaceName>Elegant</PlaceName> or <PlaceName>Modern</PlaceName> will
						clash. With a dark theme, use a flat colour from the dark quick
						picks, or a photo with a high fade.
					</p>
				</Note>
				<Note kind="info" title="Your cards keep their theme colours">
					<p>
						A background changes what is behind your content, not the content
						itself. Cards, section headings and text stay as your theme sets
						them, unless you also switch on the glass effect.
					</p>
				</Note>
			</ManualSection>

			<ManualSection kind="opts" title="The glass effect">
				<ManualText className="mb-4">
					<p>
						Glass makes your navbar, search bar, section headings and item cards
						see through, so the backdrop shows softly behind them. It is under{" "}
						<PlaceName>Style</PlaceName> in the same tab.
					</p>
				</ManualText>
				<Options>
					<Option
						defaultValue="Off"
						name="Glass effect"
						values={["Off", "Clear", "Semi", "Frosted"]}
					>
						<p>
							How strong the effect is. <FieldName>Clear</FieldName> is barely
							there, <FieldName>Frosted</FieldName> is a heavy blur. The value
							beside the label reads <FieldName>Semi-frosted</FieldName> for the
							middle setting even though the slider mark says{" "}
							<FieldName>Semi</FieldName>.
						</p>
					</Option>
					<Option
						defaultValue="All four on"
						name="Use glass on"
						values={["Navbar", "Search bar", "Section headers", "Item cards"]}
					>
						<p>
							Which surfaces get the effect. Switch the cards off and keep the
							navbar on for a lighter result. These are greyed out while the
							effect is <FieldName>Off</FieldName>.
						</p>
					</Option>
					<Option limit="20 to 85%" name="Opacity">
						<p>Lower lets more of the page show through.</p>
					</Option>
					<Option limit="0 to 40px" name="Frost">
						<p>
							How blurred what is behind becomes. Phones cap this at 20 pixels
							whatever you set.
						</p>
					</Option>
					<Option limit="0 to 24px" name="Splay">
						<p>
							Light along the edges of each surface. Past 16 pixels it starts to
							glow.
						</p>
					</Option>
				</Options>
				<Note kind="info" title="Glass needs something to show through">
					<p>
						On a plain coloured page the effect is almost invisible. Set a photo
						or a gradient background first, then turn the glass on.
					</p>
				</Note>
				<Note kind="info" title="Fine-tuning resets when you change the level">
					<p>
						Touching any of the three sliders changes the readout to{" "}
						<q>tuned</q> and adds a reset link. Moving the main{" "}
						<FieldName>Glass effect</FieldName> slider clears your tuning and
						goes back to that level&apos;s standard numbers.
					</p>
				</Note>
			</ManualSection>

			<ManualSection kind="opts" title="The overlay">
				<Options>
					<Option defaultValue="Off" name="Enable overlay">
						<p>
							Drops copies of an emoji slowly down the page, for a holiday or a
							promotion.
						</p>
					</Option>
					<Option limit="Max 3 emoji" name="Overlay icon">
						<p>
							The emoji to fall. Only emoji are accepted, and the field refuses
							anything else as you type. A counter shows how many you have used.
						</p>
					</Option>
				</Options>
			</ManualSection>

			<ManualSection kind="rules" title="Good to know">
				<Rules>
					<Rule>
						Customers on a phone get a lighter version of the glass effect, and
						no blur on item cards at all, so the page stays fast.
					</Rule>
					<Rule>
						Customers who have asked their device to reduce transparency see
						nearly solid surfaces instead. The text stays readable either way.
					</Rule>
					<Rule>
						Quick AI cannot change any of these three. Set them yourself.
					</Rule>
					<Rule>
						Dropping to a plan below Pro erases your background, your glass
						settings and your overlay. They are not remembered if you upgrade
						again.
					</Rule>
					<Rule>
						A background photo counts as in use, so Quicktalog will not clean it
						up while your catalogue refers to it.
					</Rule>
				</Rules>
			</ManualSection>

			<ManualSection kind="fix" title="Messages">
				<Messages
					messages={[
						{
							text: "Upgrade required",
							cause: "You are on a plan below Pro.",
							fix: "Select Upgrade now, or use one of the seven ready made themes, which are on every plan.",
						},
						{
							text: "SVG images aren't supported here. Please upload a PNG or JPG.",
							cause: "You tried to use an SVG as a background photo.",
							fix: "Export the image as a JPG, which suits photographs best.",
						},
						{
							text: "File is too large. Please select a smaller image",
							cause: "The photo is over 50 MB.",
							fix: "Use a smaller file. Around 1600 pixels wide is plenty.",
						},
					]}
				/>
			</ManualSection>
		</>
	);
}

const page: ManualPage = { Body, meta };
export default page;
