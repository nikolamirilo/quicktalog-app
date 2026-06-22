import { FiLayout } from "react-icons/fi";
import ArticleImage from "@/components/articles/ArticleImage";
import Callout from "@/components/articles/Callout";
import KeyTakeaways from "@/components/articles/KeyTakeaways";
import Prose from "@/components/articles/Prose";
import Stepper from "@/components/articles/Stepper";
import type { DocEntry } from "./_types";

const meta = {
	slug: "customize-design",
	title: "Customize the Design",
	description:
		"Make a catalogue look like your brand. Pick a theme, set fonts and colours, and fill in the header and footer from the Appearance tab.",
	tag: "Customize",
	icon: FiLayout,
	order: 4,
	readingTimeMinutes: 4,
	keywords: [
		"customize catalogue",
		"catalogue themes",
		"catalogue fonts",
		"brand colours",
		"header and footer",
	],
	relatedSlugs: ["share-your-catalogue", "build-and-edit"],
	coverImage: "/documentation/customize-design-cover.svg",
} satisfies DocEntry["meta"];

function Body() {
	return (
		<>
			<ArticleImage
				src="/documentation/customize-design-cover.svg"
				alt="Quicktalog design customization showing the Appearance tab with themes, fonts, and colour options"
				maxWidth="640px"
				priority
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
					"Themes give you a polished starting point in one click.",
					"Fonts and colours fine tune the look to match your brand.",
					"The header sets the first impression at the top of the page.",
					"The footer carries your business details, links, and partners.",
				]}
			/>

			<Prose>
				<h2>Pick a theme</h2>
				<p>
					A theme sets the overall look: the colours, the spacing, and the mood.
					Start by picking the one closest to your brand, then refine it. This
					is the fastest way to a page that looks finished, because the hard
					design choices are already made for you.
				</p>
			</Prose>

			<ArticleImage
				src="/documentation/customize-design-themes.svg"
				alt="Theme picker in the Quicktalog Appearance tab showing a grid of available catalogue themes"
			/>

			<Prose>
				<h2>Set fonts and colours</h2>
				<p>
					Choose a font from a long list to match your tone, from clean and
					modern to warm and classic. On higher plans you can also adjust
					colours, sizes, and shadows for a fully custom look. Keep it simple.
					One clear heading font and good contrast read better than a page full
					of competing styles.
				</p>
			</Prose>

			<Stepper
				steps={[
					{
						title: "Open the Appearance tab",
						description:
							"Find it in the builder settings panel. This is the home for themes, fonts, and styling.",
					},
					{
						title: "Choose a theme",
						description:
							"Pick the theme closest to your brand. The preview updates instantly so you can compare a few quickly.",
					},
					{
						title: "Adjust fonts and colours",
						description:
							"Set a font that fits your tone, then fine tune colours and sizes where your plan allows.",
					},
				]}
			/>

			<ArticleImage
				src="/documentation/customize-design-fonts-colours.svg"
				alt="Font and colour controls in Quicktalog showing heading font selection and brand colour options"
				maxWidth="640px"
			/>

			<Prose>
				<h2>Set up the header</h2>
				<p>
					The header is the first thing a visitor sees. Add your heading and the
					key business details so people know who you are and what they are
					looking at within a second of opening the link.
				</p>

				<h2>Fill in the footer</h2>
				<p>
					The footer is where the practical details live: your business
					information, social links, and partners. Some plans also let you
					collect newsletter sign ups here, which turns a one time visit into a
					way to reach people again.
				</p>
			</Prose>

			<ArticleImage
				src="/documentation/customize-design-header-footer.svg"
				alt="Header and footer settings showing business name, logo, social links, and contact details"
			/>

			<Callout title="Check it on a phone" variant="tip">
				Most people will open your catalogue on a phone. Quicktalog is built to
				look good on small screens, but it is still worth a quick look on your
				own phone before you share it widely, especially after changing fonts or
				images.
			</Callout>

			<ArticleImage
				src="/documentation/customize-design-mobile-check.svg"
				alt="Quicktalog catalogue previewed on a mobile phone showing the responsive layout"
				maxWidth="380px"
			/>
		</>
	);
}

const doc: DocEntry = { meta, Body };
export default doc;
