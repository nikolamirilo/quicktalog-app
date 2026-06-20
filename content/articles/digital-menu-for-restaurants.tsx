import ArticleCTA from "@/components/articles/ArticleCTA";
import ArticleImage from "@/components/articles/ArticleImage";
import BarCompare from "@/components/articles/BarCompare";
import Callout from "@/components/articles/Callout";
import KeyTakeaways from "@/components/articles/KeyTakeaways";
import Prose from "@/components/articles/Prose";
import PullQuote from "@/components/articles/PullQuote";
import StatHighlights from "@/components/articles/StatHighlights";
import Stepper from "@/components/articles/Stepper";
import type { Article } from "./_types";

const meta = {
	slug: "digital-menu-for-restaurants",
	title: "How to Create a Digital Menu for Your Restaurant (Free QR Code Menu)",
	description:
		"A step by step guide to building a free, mobile-friendly QR code menu for your restaurant. Change a price in seconds and skip the reprints for good.",
	category: "Use cases",
	keywords: [
		"digital menu for restaurants",
		"QR code menu",
		"free QR menu maker",
		"restaurant menu maker",
		"contactless menu",
		"online menu for restaurant",
	],
	heroImage:
		"https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1600&q=80",
	heroImageAlt: "A warm, busy restaurant dining room during service",
	heroCredit: { name: "Unsplash", url: "https://unsplash.com" },
	publishedAt: "2026-06-19",
	readingTimeMinutes: 7,
	author: "The Quicktalog Team",
	featured: true,
	relatedSlugs: ["qr-code-catalog-guide", "create-catalog-with-ai"],
} satisfies Article["meta"];

function Body() {
	return (
		<>
			<Prose>
				<p>
					A printed menu goes out of date the moment a supplier raises a price.
					You either live with the wrong number, cross it out with a pen, or pay
					to print the whole thing again. A digital menu removes that problem.
					You change one line, and the next guest who scans the code sees the
					new version. No reprint, no waiting.
				</p>
				<p>
					This guide walks through building one for your restaurant in an
					afternoon, for free. There is no app for your guests to download, no
					design skills required, and nothing to install. By the end you will
					have a link and a QR code you can put on every table.
				</p>
			</Prose>

			<KeyTakeaways
				points={[
					"A digital menu is a mobile web page. Guests reach it by scanning a QR code or tapping a link.",
					"You can change a price or hide a sold-out dish in seconds, and the change is live for the next scan.",
					"The QR code never changes, so you never reprint it, no matter how often you edit the menu.",
					"Guests use the camera app already on their phone. There is nothing for them to download.",
					"You can start for free, and import an existing menu from a photo instead of retyping it.",
				]}
			/>

			<Prose>
				<h2>What a digital menu actually is</h2>
				<p>
					A digital menu is your menu as a web page, built for a phone. Guests
					reach it by scanning a QR code on the table or tapping a link you
					share. They see your dishes, prices, photos, and any notes about
					allergens or specials. Because it lives online, you can update it
					whenever you want, and the change is live right away.
				</p>
				<p>
					The QR code is just the doorway. It points at your menu page, so the
					same little square on the table always shows the current menu, even
					after you have changed it a dozen times. That is the part that catches
					people out at first: you print the code once, and you are done with
					the print shop for good.
				</p>
			</Prose>

			<StatHighlights
				stats={[
					{ value: "0", label: "Reprints, ever again" },
					{ value: "30s", label: "To change a price" },
					{ value: "$0", label: "To start on the free plan" },
				]}
			/>

			<ArticleImage
				alt="A Quicktalog digital menu open on a smartphone"
				caption="A digital menu adapts to whatever screen your guest is holding."
				src="/images/hero-mockup.png"
			/>

			<Prose>
				<h2>Why restaurants are making the switch</h2>
				<p>
					The reasons are practical, not trendy. Prices move, and a digital menu
					keeps up without a trip to the print shop. Photos help guests decide
					faster and tend to lift orders on the dishes you want to sell. A menu
					built for a phone is easier to read than a PDF that someone has to
					pinch and zoom. And when a dish runs out, you can hide it in seconds
					instead of apologizing to every table.
				</p>
				<p>
					There is a quieter benefit too. Once your menu is a link, you can put
					it anywhere your guests already are, from your Instagram profile to
					your Google listing to a sign in the window. The cost side is just as
					plain. A printed menu is a bill you pay again every time something
					changes.
				</p>
			</Prose>

			<BarCompare
				caption="A rough year for a small restaurant that reprints a few times and pays for design help. A digital menu folds those changes into the price you already pay, with the free plan covering a single menu."
				items={[
					{
						label: "Reprinting laminated menus",
						value: 600,
						display: "~$600",
					},
					{
						label: "Designer for each new version",
						value: 350,
						display: "~$350",
					},
					{
						label: "Digital menu on Quicktalog",
						value: 0,
						display: "$0",
						highlight: true,
					},
				]}
				title="Yearly cost of menu changes: print versus digital"
			/>

			<Callout title="Already have a printed menu?">
				You do not have to retype it. Take a clear photo of each page and let
				OCR import pull the dishes and prices into a draft for you. Fix the few
				things it gets wrong, and you are most of the way there. If you would
				rather start from a description of your restaurant, the{" "}
				<a href="/articles/create-catalog-with-ai">AI generator</a> can draft a
				first version for you to edit.
			</Callout>

			<Prose>
				<h2>Build your menu in four steps</h2>
				<p>
					Here is the whole process with Quicktalog. Each step takes a few
					minutes, and you can come back and change anything later.
				</p>
			</Prose>

			<Stepper
				steps={[
					{
						title: "Add your dishes",
						description:
							"Start a new catalog and add your items, grouped the way your menu already reads: starters, mains, drinks, desserts. Give each a name, a price, and a short description, and add photos if you have them. In a hurry, let the AI generator draft a first version, or import a photo of your current menu with OCR.",
					},
					{
						title: "Pick a template",
						description:
							"Choose a layout that fits your place. A tasting menu and a busy diner want different looks, and the templates give you a head start so you are not designing from scratch.",
					},
					{
						title: "Brand it",
						description:
							"Add your logo and set the colors to match your sign and your napkins. This is the difference between a menu that feels like yours and one that feels generic.",
					},
					{
						title: "Share the QR code",
						description:
							"Publish to get a link and a QR code. Print the code for the tables and you are live. Change a price next week and the same code still works.",
					},
				]}
			/>

			<ArticleCTA variant="mid" />

			<Prose>
				<h2>Make the menu sell for you</h2>
				<p>
					A menu is not just a list of prices. It is the only piece of marketing
					every single guest reads, so small details earn their keep. A clear
					photo on a dish you want to move is the closest thing to a server
					recommending it. Restaurants often see orders shift toward whatever
					has a good picture next to it, so photograph the plates with the best
					margin, not just the prettiest ones.
				</p>
				<p>
					Allergen notes belong here too, and a digital menu handles them better
					than paper ever did. You can tag a dish as containing nuts, gluten, or
					dairy without cramming a legend into the footer, and you can correct a
					mistake the moment the kitchen flags it. Guests with allergies tend to
					remember the place that made it easy.
				</p>
			</Prose>

			<PullQuote cite="A line cook who has reprinted one too many menus">
				The menu is the only marketing every guest actually reads. It should
				never be out of date.
			</PullQuote>

			<Prose>
				<h2>Where to put the QR code</h2>
				<p>
					The table is the obvious spot, on a small stand or printed on the
					placemat. It is not the only one. Put the code in the window so people
					can read the menu before they walk in. Add it to takeaway boxes and
					receipts so guests can find you again. Drop the link in your Instagram
					bio and your Google Business profile, where a lot of people check the
					menu before they decide where to eat.
				</p>
				<p>
					A few placement habits save you grief. Keep the code large enough to
					scan from a seated arm's length, around an inch and a half across at
					minimum. Leave quiet white space around it so a busy background does
					not confuse the camera. And test the printed version before you put it
					out, because a code that looks fine on screen can fail once it is
					laminated under glare. Our{" "}
					<a href="/articles/qr-code-catalog-guide">QR code menu guide</a> goes
					deeper on sizing and printing.
				</p>

				<h2>Keeping it current</h2>
				<p>
					This is where a digital menu earns its keep. Three jobs come up almost
					every week, and each one used to mean a marker or a reprint.
				</p>
				<ul>
					<li>
						<strong>86 a dish.</strong> When the kitchen runs out of the
						special, hide it in a couple of taps so no one orders what you
						cannot make. Bring it back when the next delivery lands.
					</li>
					<li>
						<strong>Move a price.</strong> When a supplier cost jumps, edit the
						number and save. The next guest to scan sees the new price, and you
						never crossed anything out with a pen.
					</li>
					<li>
						<strong>Swap in a seasonal menu.</strong> Build the autumn or
						holiday menu ahead of time, then publish it when you are ready. The
						code on the table never changes, so the switch costs nothing.
					</li>
				</ul>
			</Prose>

			<Callout title="A quiet edge over your competition" variant="note">
				Most printed menus in your area are at least a season out of date. A
				menu that always reflects today's prices and today's specials is a small
				thing guests notice, and it costs you nothing to keep it that way.
			</Callout>

			<Prose>
				<h2>Common questions</h2>
				<p>
					<strong>Does it cost anything?</strong> You can build and share one
					menu for free. Paid plans add more catalogs and extras like analytics,
					but the core menu does not cost anything to start.
				</p>
				<p>
					<strong>Do guests need an app?</strong> No. They scan with the camera
					app that is already on their phone, and the menu opens in the browser.
					Phones from the last several years do this without any extra setup.
				</p>
				<p>
					<strong>What if a guest cannot scan the code?</strong> Print the link
					under the code as plain text, or keep a few printed menus at the door.
					Most people scan without a second thought, but it is worth having a
					backup for the few who do not.
				</p>
				<p>
					<strong>Can I handle allergens and dietary tags?</strong> Yes. Mark a
					dish as vegetarian, vegan, or containing common allergens, and fix any
					detail the moment the kitchen changes a recipe. No reprint, no
					outdated legend in the footer.
				</p>
				<p>
					<strong>Can I still keep a few printed menus?</strong> Of course.
					Plenty of restaurants keep a handful at the door for guests who prefer
					paper and use the digital menu for everyone else.
				</p>
				<p>
					A menu that updates the moment you do is one less thing to worry about
					on a busy night. Build it once, share the code, and edit it whenever
					the kitchen changes its mind.
				</p>
			</Prose>
		</>
	);
}

const article: Article = { meta, Body };
export default article;
