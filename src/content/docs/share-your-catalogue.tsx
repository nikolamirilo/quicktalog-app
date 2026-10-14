import { FiShare2 } from "react-icons/fi";
import { ArticleImage } from "@/components/resources/ArticleImage";
import { Callout } from "@/components/resources/Callout";
import { KeyTakeaways } from "@/components/resources/KeyTakeaways";
import { Prose } from "@/components/resources/Prose";
import { Stepper } from "@/components/resources/Stepper";
import type { DocEntry } from "./_types";

const meta = {
	slug: "share-your-catalogue",
	title: "Share Your Catalogue",
	description:
		"Publish your catalogue and get it in front of customers: a link that works anywhere, a branded QR code you can print, and an embed for your own website.",
	tag: "Share",
	icon: FiShare2,
	order: 6,
	readingTimeMinutes: 5,
	keywords: [
		"share catalogue",
		"catalogue link",
		"QR code catalogue",
		"publish catalogue",
		"embed catalogue",
	],
	relatedSlugs: ["track-performance", "customize-design"],
} satisfies DocEntry["meta"];

function Body() {
	return (
		<>
			<ArticleImage
				alt="Sharing a Quicktalog catalogue via a link and a branded QR code"
				maxWidth="640px"
				priority
				src="/images/documentation/share-catalogue-cover.svg"
			/>

			<Prose>
				<p>
					A catalogue is only useful once people can see it. When yours reads
					well, publishing and sharing it takes seconds. You get a link that
					works on any device, a QR code you can put anywhere in the real world,
					and a snippet for dropping the catalogue straight into your own site.
				</p>
			</Prose>

			<KeyTakeaways
				points={[
					"Publishing makes your catalogue live, and later edits go out the moment you publish again.",
					"Every catalogue has its own link that opens on any phone, tablet, or computer.",
					"The QR code can be styled to match your brand and downloaded as PNG, JPEG or SVG.",
					"You can also embed the catalogue in a page you already run.",
				]}
			/>

			<Prose>
				<h2>Publish your catalogue</h2>
				<p>
					Publishing takes your draft live. From then on, any edits you make
					stay private until you publish again, so you control exactly when
					changes reach customers. There is no reprinting and no waiting, which
					is the whole point of a digital catalogue over a printed one.
				</p>
				<p>
					A live catalogue is marked <strong>Active</strong> on your dashboard.
					From the same menu you can deactivate it, which takes it offline
					without deleting anything, and activate it again later. That is the
					switch to reach for when a seasonal menu is out of season.
				</p>
			</Prose>

			<ArticleImage
				alt="The publish button in the Quicktalog builder taking a draft catalogue live"
				maxWidth="380px"
				src="/images/documentation/share-catalogue-publish.svg"
			/>

			<Prose>
				<h2>Three ways to share it</h2>
				<p>
					The share dialog on each catalogue carries all three, and you can use
					as many as you like at once. They all point at the same page.
				</p>
				<ul>
					<li>
						<strong>The link.</strong> Send it by text or email, put it in your
						social profiles, or add it to your website. It opens straight away
						on any device, with nothing for the customer to install.
					</li>
					<li>
						<strong>The QR code.</strong> For the physical world: a table card,
						a window, a flyer, the side of a van.
					</li>
					<li>
						<strong>The embed.</strong> A snippet you paste into a page you
						already run, so the catalogue appears inside your own site and still
						updates whenever you publish.
					</li>
				</ul>
			</Prose>

			<ArticleImage
				alt="Channels for sharing a catalogue link: text message, email, social media profiles, and website"
				maxWidth="380px"
				src="/images/documentation/share-catalogue-link-channels.svg"
			/>

			<Prose>
				<h2>Make the QR code yours</h2>
				<p>
					Every catalogue has a QR editor, on every plan. You can change the
					colours of the code and its background, change the shape of its dots
					and corners, drop your logo in the middle, and print a short line of
					text under it. Download the result as a PNG or JPEG for most uses, or
					an SVG when a printer asks for something that scales.
				</p>
				<p>
					As you style it, the editor tells you whether the code still scans
					cleanly. Heavy colours and a large logo are the two things that push a
					code over the line, so if it warns you, take the logo down a size
					before you send anything to print.
				</p>
			</Prose>

			<Stepper
				steps={[
					{
						title: "Publish",
						description:
							"Push your draft live from the builder. Your catalogue is now reachable at its own link.",
					},
					{
						title: "Copy and share the link",
						description:
							"Drop it into a text, an email, a social bio, or your website. Anyone who taps it sees your catalogue.",
					},
					{
						title: "Customize your QR code",
						description:
							"Open the QR editor to change colours, add your logo, and add a short line of text so people know what they are scanning.",
					},
					{
						title: "Download and print",
						description:
							"Export the code and put it on a sign, a table card, a menu, or a flyer where customers will scan it.",
					},
				]}
			/>

			<ArticleImage
				alt="Branded QR codes placed on a table card, a sign, a menu, and a flyer"
				src="/images/documentation/share-catalogue-qr-placements.svg"
			/>

			<Callout title="Make the QR code earn its place" variant="tip">
				A QR code works best when it is easy to scan and clear about what it
				does. Keep good contrast, leave a little quiet space around it, and add
				a short line like View our menu so people know why they should scan.
			</Callout>

			<Prose>
				<h2>Update any time</h2>
				<p>
					Because the catalogue lives online, the same link, QR code and embed
					keep working after you change the contents. Update a price, add a
					seasonal item, or run a promotion, publish, and everyone who scans the
					existing code sees the new version. You never reprint a thing.
				</p>
			</Prose>

			<ArticleImage
				alt="Updating a live catalogue: edit in the builder, publish, and the same link and QR code show the new version"
				maxWidth="640px"
				src="/images/documentation/share-catalogue-update.svg"
			/>
		</>
	);
}

const doc: DocEntry = { meta, Body };
export default doc;
