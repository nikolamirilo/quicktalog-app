import { themes } from "@quicktalog/common";
import { FiLayout } from "react-icons/fi";
import { ArticleImage } from "@/components/resources/ArticleImage";
import { Callout } from "@/components/resources/Callout";
import { KeyTakeaways } from "@/components/resources/KeyTakeaways";
import { Prose } from "@/components/resources/Prose";
import { Stepper } from "@/components/resources/Stepper";
import type { DocEntry } from "./_types";

const meta = {
	slug: "customize-design",
	title: "Customize the Design",
	description:
		"Make a catalogue look like your brand. Pick a theme or mix your own colours, set fonts and shapes, and fill in the header and footer.",
	tag: "Customize",
	icon: FiLayout,
	order: 5,
	readingTimeMinutes: 5,
	keywords: [
		"customize catalogue",
		"catalogue themes",
		"custom colours",
		"catalogue fonts",
		"header and footer",
	],
	relatedSlugs: ["share-your-catalogue", "quick-ai"],
} satisfies DocEntry["meta"];

function Body() {
	return (
		<>
			<ArticleImage
				alt="Quicktalog design customization showing the Appearance tab with themes, fonts, and colour options"
				maxWidth="640px"
				priority
				src="/images/documentation/customize-design-cover.svg"
			/>

			<Prose>
				<p>
					A catalogue should look like it belongs to your business, not like a
					template. Most of the styling lives under the Appearance tab, where a
					few choices change the whole feel of the page. You do not need design
					experience. The themes are built to look good out of the box, and you
					adjust from there.
				</p>
			</Prose>

			<KeyTakeaways
				points={[
					`${themes.length} themes give you a polished starting point in one click.`,
					"On higher plans you can mix your own colours and save them to reuse.",
					"Fonts, sizes, corners and shadows fine tune the feel.",
					"The header sets the first impression; the footer carries your details.",
				]}
			/>

			<Prose>
				<h2>Pick a theme</h2>
				<p>
					A theme sets the overall look: the colours, the spacing, and the mood.
					There are {themes.length} of them, light and dark, and they are on
					every plan including the free one. Start by picking the one closest to
					your brand, then refine it. This is the fastest way to a page that
					looks finished, because the hard design choices are already made for
					you.
				</p>
			</Prose>

			<ArticleImage
				alt="Theme picker in the Quicktalog Appearance tab showing a grid of available catalogue themes"
				src="/images/documentation/customize-design-themes.svg"
			/>

			<Prose>
				<h3>Or mix your own</h3>
				<p>
					If none of the themes is quite your brand, higher plans let you set
					the colours yourself: the page background, headings, body text, the
					card background, and the two accent colours used for prices and
					buttons. Save the result with a name and it joins your theme library,
					ready to apply to your other catalogues with one tap.
				</p>
				<p>
					Quick AI can do this for you. Describe the palette you want, or name
					the colours from your logo, and ask it to save the theme under a name
					you choose.
				</p>

				<h2>Set fonts and shapes</h2>
				<p>
					Below the themes, the Style controls change how the page feels without
					touching its colours: the font, the size of body text, how rounded the
					corners are, and how much shadow sits under each card. Keep it simple.
					One clear font and good contrast read better than a page full of
					competing styles.
				</p>
				<p>
					The glass effect sits with the Style controls too. It makes the
					navbar, search bar, section headers and item cards see-through, like
					frosted glass, so the page shows softly behind them as visitors
					scroll. Pick Clear, Semi-frosted or Frosted, choose which of those
					surfaces use it, and fine-tune it if you want.
				</p>
				<p>
					You can also replace the theme&apos;s background with your own photo,
					a ready-made gradient or a single colour. Your cards and text keep the
					theme&apos;s colours, so pick a light background for a light theme and
					a dark one for a dark theme; the builder warns you when they clash.
				</p>
				<p>
					There is also an overlay, a small emoji that floats above the page.
					Used sparingly it is a cheap way to mark a season or a promotion
					without redesigning anything.
				</p>
			</Prose>

			<Stepper
				steps={[
					{
						title: "Open the Appearance tab",
						description:
							"Find it in the builder settings panel. This is the home for themes, colours, and style.",
					},
					{
						title: "Choose a theme",
						description:
							"Pick the theme closest to your brand. The preview updates instantly so you can compare a few quickly.",
					},
					{
						title: "Adjust the details",
						description:
							"Set a font that fits your tone, then fine tune colours, sizes and shadows where your plan allows.",
					},
				]}
			/>

			<ArticleImage
				alt="Font and colour controls in Quicktalog showing font selection and custom brand colour options"
				maxWidth="640px"
				src="/images/documentation/customize-design-fonts-colours.svg"
			/>

			<Prose>
				<h2>Set up the header</h2>
				<p>
					The header is the first thing a visitor sees. Add your logo and
					heading so people know who you are within a second of opening the
					link. On paid plans you can go further: switch the header to a custom
					layout and you can add a button that points wherever you need, show
					tap-to-call and tap-to-email icons, and set how large the logo sits.
					The header floats at the top of the page while visitors scroll, and on
					phones its icons fold into a small menu.
				</p>

				<h2>Fill in the footer</h2>
				<p>
					The footer is where the practical details live: your business
					information, social links, partners, and your legal details if you
					need them shown. Like the header, it has a custom layout on paid plans
					with a button of its own and a one-line tagline under your logo.
					Higher plans can also put a newsletter sign-up here, which turns a
					one-time visit into a way to reach people again, and you can export
					the addresses you collect from your dashboard.
				</p>
			</Prose>

			<ArticleImage
				alt="Header and footer settings showing business name, logo, social links, and contact details"
				src="/images/documentation/customize-design-header-footer.svg"
			/>

			<Callout title="Check it on a phone" variant="tip">
				Most people will open your catalogue on a phone. Quicktalog is built to
				look good on small screens, but it is still worth a quick look on your
				own phone before you share it widely, especially after changing fonts or
				images.
			</Callout>

			<ArticleImage
				alt="Quicktalog catalogue previewed on a mobile phone showing the responsive layout"
				maxWidth="380px"
				src="/images/documentation/customize-design-mobile-check.svg"
			/>
		</>
	);
}

const doc: DocEntry = { meta, Body };
export default doc;
