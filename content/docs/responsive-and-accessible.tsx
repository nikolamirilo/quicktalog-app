import ArticleImage from "@/components/articles/ArticleImage";
import Callout from "@/components/articles/Callout";
import KeyTakeaways from "@/components/articles/KeyTakeaways";
import Prose from "@/components/articles/Prose";
import { FiSmartphone } from "react-icons/fi";
import type { DocEntry } from "./_types";

const meta = {
	slug: "responsive-and-accessible",
	title: "Responsiveness & Accessibility",
	description:
		"Your catalogue looks right on every screen and works for every visitor - no configuration needed. One link is the single source of truth for phones, tablets, and desktops.",
	tag: "Accessibility",
	icon: FiSmartphone,
	order: 7,
	readingTimeMinutes: 3,
	keywords: [
		"responsive catalogue",
		"accessible digital menu",
		"mobile friendly catalogue",
		"single source of truth",
		"catalogue accessibility",
	],
	relatedSlugs: ["customize-design", "share-your-catalogue"],
	coverImage: "/documentation/docs-landing-one-source.svg",
} satisfies DocEntry["meta"];

function Body() {
	return (
		<>
			<ArticleImage
				src="/documentation/docs-landing-one-source.svg"
				alt="One catalogue as the single source feeding phones, tablets, desktops, and print"
				priority
			/>

			<Prose>
				<p>
					Most digital tools make you choose between a mobile experience and a
					desktop one, or maintain both in parallel. Quicktalog does not.
					Whatever screen your customer opens your catalogue on, they get the
					same content, the same prices, and the same updates - laid out to fit
					the device in front of them. You build once and it works everywhere.
				</p>
			</Prose>

			<KeyTakeaways
				points={[
					"Catalogues reflow automatically for phones, tablets, and desktops - no mobile version to maintain.",
					"One link is the single source of truth: every device reads from the same catalogue.",
					"Keyboard navigation, screen reader support, and colour contrast meet accessibility standards out of the box.",
					"When you publish an update, every screen sees it immediately - no sync, no separate deploy.",
				]}
			/>

			<Prose>
				<h2>Responsive by default</h2>
				<p>
					Every catalogue is built on a responsive layout. On a phone, items
					stack vertically and the text scales to a comfortable reading size. On
					a tablet or desktop, the same content spreads into a wider grid. You
					do not configure any of this. The layout adapts as soon as the page
					loads on any screen size, from the smallest phone to a large monitor.
				</p>
				<p>
					This matters in practice because most customers open a catalogue link
					or scan a QR code on their phone. A page that breaks on a small screen
					or forces pinching and zooming loses people fast. Quicktalog handles
					the small-screen layout for you so you can focus on the content.
				</p>
			</Prose>

			<ArticleImage
				src="/documentation/responsive-devices-layout.svg"
				alt="The same catalogue shown on a phone, tablet, and desktop - layout adapts automatically to each screen size"
			/>

			<Prose>
				<h2>One catalogue, every screen</h2>
				<p>
					The single link you share is not a redirect to a mobile site or a
					simplified version. It is the catalogue itself, responsive. Every
					screen reads the same source, which means there is no drift between
					what a phone customer sees and what a desktop customer sees. Update a
					price, add a photo, change a description, and every device picks up
					the change the next time the page loads.
				</p>
				<p>
					This single-source model also makes QR codes reliable over time. The
					code you print on a sign points to the same catalogue a customer finds
					via a link in your bio. Both always show the current version, because
					there is only one version.
				</p>
			</Prose>

			<Callout title="One update, everywhere at once" variant="tip">
				If you change your catalogue while a customer has it open, they see the
				new version on their next visit. You never need to push a separate
				update to a mobile version or reprint anything to keep prices in sync.
			</Callout>

			<Prose>
				<h2>Accessible out of the box</h2>
				<p>
					Accessibility is built into the catalogue structure, not added later.
					Heading levels follow a logical order so screen readers can navigate
					by section. All images include descriptive text that assistive
					technology reads aloud. Interactive elements like links and buttons
					are reachable by keyboard in a predictable tab order. Colour contrast
					between text and background meets the WCAG AA standard across all
					built-in themes.
				</p>
				<p>
					This means customers who use screen readers, keyboard navigation, or
					high-contrast display modes can use your catalogue without any extra
					work on your part. Accessibility is not a feature to turn on. It is
					how the catalogue is built.
				</p>
			</Prose>

			<ArticleImage
				src="/documentation/responsive-accessibility-features.svg"
				alt="Three accessibility features: keyboard navigation with focus ring, screen reader support, and WCAG AA colour contrast"
			/>

			<Prose>
				<h2>What you never have to do</h2>
				<p>
					Because responsiveness and accessibility are defaults, several things
					are simply not your problem. There is no separate mobile site to keep
					in sync. There is no app for your customers to download or update.
					There is no accessibility audit to run before you publish. And there
					is no version mismatch between what one group of customers sees and
					what another sees.
				</p>
				<p>
					The practical result is less maintenance, not just at launch but
					permanently. When you change your catalogue, one publish reaches
					everyone, on every device, instantly.
				</p>
			</Prose>

			<Callout title="Test it on your own phone" variant="note">
				The best way to see responsiveness in action is to share your catalogue
				link to yourself and open it on your phone. What your customer sees is
				exactly what you see - the same catalogue, sized for the screen.
			</Callout>
		</>
	);
}

const doc: DocEntry = { meta, Body };
export default doc;
