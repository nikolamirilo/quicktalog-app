import ArticleCTA from "@/components/articles/ArticleCTA";
import ArticleImage from "@/components/articles/ArticleImage";
import Callout from "@/components/articles/Callout";
import KeyTakeaways from "@/components/articles/KeyTakeaways";
import ProsCons from "@/components/articles/ProsCons";
import Prose from "@/components/articles/Prose";
import PullQuote from "@/components/articles/PullQuote";
import StatHighlights from "@/components/articles/StatHighlights";
import Stepper from "@/components/articles/Stepper";
import type { Article } from "./_types";

const meta = {
	slug: "qr-code-catalog-guide",
	title: "QR Codes for Menus and Catalogs: The Complete Guide",
	description:
		"How to make a QR code for your menu or catalog, design it so it actually scans, place it where people will use it, and track how often it gets scanned.",
	category: "Guides",
	keywords: [
		"QR code menu",
		"how to make a QR code menu",
		"QR code for catalog",
		"track QR code scans",
		"custom QR code",
		"QR code generator for restaurant",
	],
	heroImage:
		"https://images.unsplash.com/photo-1600147131759-880e94a6185f?auto=format&fit=crop&w=1600&q=80",
	heroImageAlt: "A diner holding up a QR code card at a restaurant table",
	heroCredit: { name: "Unsplash", url: "https://unsplash.com" },
	publishedAt: "2026-06-16",
	readingTimeMinutes: 7,
	author: "The Quicktalog Team",
	relatedSlugs: [
		"digital-menu-for-restaurants",
		"digital-service-menu-salons-spas",
	],
} satisfies Article["meta"];

function Body() {
	return (
		<>
			<Prose>
				<p>
					A QR code is a small square that points a phone at a web page. Someone
					opens their camera, holds it over the code, and taps the link that
					pops up. For a menu or a catalog, that means a guest reaches the
					current version in about a second, without typing an address or
					searching for your name. The square does the work that a printed page
					used to do, except the page behind it can change whenever you want.
				</p>
				<p>
					That last part is the whole point, and it is where most people make
					their one expensive mistake. The code you generate can be static or
					dynamic, and the two look identical on paper. One of them locks you in
					forever. The other one does not. The rest of this guide covers the
					difference, how to make a code that actually scans, where to put it,
					and how to learn from the scans you get.
				</p>
			</Prose>

			<KeyTakeaways
				points={[
					"A dynamic QR code points at a link you control, so you can change the menu behind it without ever reprinting the code.",
					"A static code bakes the address in, so a single broken link means a full reprint.",
					"Contrast, a quiet zone, and a sensible print size matter more than how the code looks.",
					"Always test a code at real size on a few phones before you print a stack.",
					"Tracking scans tells you which placements work, something paper never could.",
				]}
			/>

			<Prose>
				<h2>Static versus dynamic, and why it matters</h2>
				<p>
					A static QR code has the web address written into the pattern itself.
					Generate it, print it, and it points at that one address for as long
					as it exists. If you ever move the page, rename it, or switch
					platforms, the code is dead, and every sticker, card, and poster
					carrying it has to be replaced. A dynamic code works differently. It
					points at a stable link that you own, and you decide what sits behind
					that link. Change the menu, swap the whole catalog, fix a typo in the
					address, and the printed square never knows the difference.
				</p>
				<p>
					For anything you print once and live with for months, dynamic is the
					only sensible choice. The cost of getting this wrong is not the code,
					it is the reprint, the reapplied stickers, and the week your tables
					point at a broken page.
				</p>
			</Prose>

			<ProsCons
				cons={[
					"The address is baked in and can never change.",
					"A moved or renamed page kills every copy you printed.",
					"A new menu means a new code and a new print run.",
					"No built-in way to tell whether anyone scans it.",
				]}
				consLabel="Static printed code"
				pros={[
					"Point it anywhere, then change the destination later without touching the print.",
					"Fix a broken or renamed link in seconds, no reprint.",
					"Swap a seasonal menu for a new one behind the same square.",
					"Carries scan analytics, so you can see how often it is used.",
				]}
				prosLabel="Dynamic code"
				title="Static printed code vs dynamic code"
			/>

			<PullQuote cite="The rule that saves the most reprints">
				The link can change a hundred times. The code never has to.
			</PullQuote>

			<Prose>
				<h2>Make one in three steps</h2>
				<p>
					Inside Quicktalog the code comes straight from your published catalog,
					so it is dynamic by default. There is nothing extra to wire up and no
					separate generator to trust with your link.
				</p>
			</Prose>

			<Stepper
				steps={[
					{
						title: "Publish your catalog",
						description:
							"Once your menu or catalog is live, it has a stable link. That link is what the QR code points to, and it does not change when you edit the content behind it.",
					},
					{
						title: "Generate and style the code",
						description:
							"Create the QR code from your catalog, then make it yours. Set the colors to match your brand and drop your logo in the middle so the square looks like it belongs to you rather than a random generator.",
					},
					{
						title: "Download and put it to work",
						description:
							"Export the code and place it where people are: a table card, a poster, your packaging, a receipt, or your social profiles. The same code can live in all of those at once.",
					},
				]}
			/>

			<ArticleImage
				alt="A QR code shown on a tablet for guests to scan"
				caption="A dynamic QR code keeps working even after you change the menu behind it."
				credit={{ name: "Unsplash", url: "https://unsplash.com" }}
				src="https://images.unsplash.com/photo-1661169398346-aecdc4f5068b?auto=format&fit=crop&w=1600&q=80"
			/>

			<Prose>
				<h2>Designing a code that still scans</h2>
				<p>
					You can style a QR code, but the camera has limits that are worth
					respecting. The pattern is read by contrast, so keep the code dark on
					a light background. Dark on light is the safe default, and inverting
					it, light code on a dark field, fails on more phones than you would
					expect. If you add a logo in the middle, keep it small. The code has
					built-in error correction that tolerates a little cover, but a logo
					that swallows the center pattern will stop it reading.
				</p>
				<p>
					Leave a clear margin around the square, called the quiet zone. That
					empty band is how the camera finds the edges of the code, and crowding
					it with text or a border is one of the most common reasons a code that
					looked fine on screen refuses to scan in print. The honest rule is
					simple: a plain code that always scans beats a beautiful one that
					works only half the time.
				</p>
			</Prose>

			<StatHighlights
				stats={[
					{ value: "0", label: "reprints when your menu changes" },
					{ value: "30 sec", label: "to update the destination" },
					{ value: "Every scan", label: "tracked in your analytics" },
				]}
			/>

			<Callout title="Print mistakes to avoid" variant="warning">
				Five traps catch people out. A code printed too small to scan from where
				people actually stand. Weak contrast, like a pale code on a busy
				background. No quiet zone, so the camera cannot lock on. A dead link
				behind a static code that has moved. And no test print, so you only find
				the problem after a hundred copies are out the door. Check all five
				before you commit to a run.
			</Callout>

			<ArticleCTA variant="mid" />

			<Prose>
				<h2>Where to place it</h2>
				<p>
					A code only helps if people can find it and reach it comfortably. On a
					table, put it on a small stand at eye level rather than flat on the
					surface where glasses and plates end up covering it. In a shop, the
					window pulls in passers-by and the counter catches people while they
					wait. On packaging and receipts, the code turns a one-time visit into
					a way back to you, which works as well for a printed{" "}
					<a href="/articles/digital-menu-for-restaurants">restaurant menu</a>{" "}
					as it does for a{" "}
					<a href="/articles/digital-service-menu-salons-spas">
						salon or spa service list
					</a>
					. Online, the same link belongs in your Instagram bio and your Google
					Business profile, so the code and the link reinforce each other.
				</p>
				<p>
					Wherever it goes, give the code a label. A short line like "Scan for
					our menu" removes the moment of doubt where someone wonders what the
					square is for and walks past it.
				</p>

				<h2>Printing tips that keep it readable</h2>
				<p>
					Size is the setting people get wrong most. A code on a table card can
					be small because the phone comes close, but a code in a shop window
					needs to be large enough to scan from the pavement. As a rough guide,
					the further the reader stands, the bigger the code. Print on a matte
					surface where you can, since glossy stock and laminate throw glare
					that blinds the camera under bright light. Keep the code square, never
					stretched to fill a space, and keep the quiet zone clear right through
					to the final proof.
				</p>

				<h2>Track scans and learn from them</h2>
				<p>
					This is the part paper never gave you. With analytics you can see how
					often your code is scanned and your catalog is viewed, broken down
					over time. That tells you whether the code on the table is actually
					getting used, whether a flyer earned its print run, and which days
					bring the most interest. Over a few weeks the numbers settle into
					patterns, and a pattern is something you can act on: move a code that
					nobody scans, lean into a placement that works, or time a menu change
					for your busiest day.
				</p>
				<p>
					Get the basics right, point the code at a catalog you can edit
					anytime, and that small square keeps doing its job long after the ink
					is dry.
				</p>
			</Prose>
		</>
	);
}

const article: Article = { meta, Body };
export default article;
