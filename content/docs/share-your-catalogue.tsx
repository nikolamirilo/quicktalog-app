import { FiShare2 } from "react-icons/fi";
import Callout from "@/components/articles/Callout";
import KeyTakeaways from "@/components/articles/KeyTakeaways";
import Prose from "@/components/articles/Prose";
import Stepper from "@/components/articles/Stepper";
import type { DocEntry } from "./_types";

const meta = {
	slug: "share-your-catalogue",
	title: "Share Your Catalogue",
	description:
		"Publish your catalogue and get it in front of customers with a link and a branded QR code you can print on signs, menus, and flyers.",
	tag: "Share",
	icon: FiShare2,
	order: 5,
	readingTimeMinutes: 4,
	keywords: [
		"share catalogue",
		"catalogue link",
		"QR code catalogue",
		"publish catalogue",
		"custom QR code",
	],
	relatedSlugs: ["track-performance", "customize-design"],
} satisfies DocEntry["meta"];

function Body() {
	return (
		<>
			<Prose>
				<p>
					A catalogue is only useful once people can see it. When yours reads
					well, publishing and sharing it takes seconds. You get a link that
					works on any device and a QR code you can put anywhere in the real
					world.
				</p>
			</Prose>

			<KeyTakeaways
				points={[
					"Publishing makes your catalogue live, and later edits go out the moment you publish again.",
					"Every catalogue has its own link that opens on any phone, tablet, or computer.",
					"The QR code can be styled to match your brand and downloaded to print.",
					"Customers need no app and no account to view your catalogue.",
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

				<h2>Share the link</h2>
				<p>
					Each catalogue has its own web link. Send it by text or email, put it
					in your social profiles, or add it to your website. It opens straight
					away on any device, with nothing for the customer to install.
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
							"Open the QR editor to change colours, add your logo, and pick a frame so the code matches your brand.",
					},
					{
						title: "Download and print",
						description:
							"Export the QR code and put it on a sign, a table card, a menu, or a flyer where customers will scan it.",
					},
				]}
			/>

			<Callout title="Make the QR code earn its place" variant="tip">
				A QR code works best when it is easy to scan and clear about what it
				does. Keep good contrast, leave a little quiet space around it, and add
				a short line like View our menu so people know why they should scan.
			</Callout>

			<Prose>
				<h2>Update any time</h2>
				<p>
					Because the catalogue lives online, the same link and QR code keep
					working after you change the contents. Update a price, add a seasonal
					item, or run a promotion, publish, and everyone who scans the existing
					code sees the new version. You never reprint a thing.
				</p>
			</Prose>
		</>
	);
}

const doc: DocEntry = { meta, Body };
export default doc;
