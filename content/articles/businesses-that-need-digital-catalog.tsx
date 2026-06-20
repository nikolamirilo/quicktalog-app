import ArticleCTA from "@/components/articles/ArticleCTA";
import ArticleImage from "@/components/articles/ArticleImage";
import Callout from "@/components/articles/Callout";
import KeyTakeaways from "@/components/articles/KeyTakeaways";
import Prose from "@/components/articles/Prose";
import PullQuote from "@/components/articles/PullQuote";
import StatHighlights from "@/components/articles/StatHighlights";
import Stepper from "@/components/articles/Stepper";
import type { Article } from "./_types";

const meta = {
	slug: "businesses-that-need-digital-catalog",
	title: "12 Businesses That Need a Digital Catalog (and How to Make One Free)",
	description:
		"From restaurants to real estate, a dozen businesses that benefit from a digital catalog, what to put in one, and how to start for free.",
	category: "Use cases",
	keywords: [
		"digital catalog for small business",
		"who needs a digital catalog",
		"digital catalog ideas",
		"online catalog for retail",
		"catalog for service business",
	],
	heroImage:
		"https://images.unsplash.com/photo-1753161029492-0644556055cf?auto=format&fit=crop&w=1600&q=80",
	heroImageAlt:
		"A boutique owner checking clothing stock on a tablet in her shop",
	heroCredit: { name: "Unsplash", url: "https://unsplash.com" },
	publishedAt: "2026-06-14",
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
					A printed price list goes stale the day you raise a price. A PDF
					emailed to a customer is hard to read on a phone and impossible to
					find again two weeks later. Most small businesses already keep a
					catalog of some kind, a menu, a service list, a set of packages, even
					if it lives on a chalkboard or in your head. The question is whether
					it works where your customers actually look, which is their phone.
				</p>
				<p>
					A digital catalog is one shareable page that lists what you offer,
					with prices and photos, that you can update in seconds. Below are
					twelve kinds of business that get the most out of one. Each comes with
					a real situation and a note on what to put in the catalog.
				</p>
			</Prose>

			<KeyTakeaways
				points={[
					"Almost any business with a menu, a price list, or a set of services can replace it with one shareable page.",
					"The common thread is change: prices, stock, and seasons move, so the catalog has to be editable in seconds, not reprinted.",
					"A link plus a QR code reaches customers on the phone they already have in hand.",
					"You can publish a first catalog for free, from a blank page, an AI draft, or a list you already keep.",
				]}
			/>

			<StatHighlights
				stats={[
					{ value: "12", label: "Business types in this guide" },
					{ value: "1 link", label: "Replaces every PDF and reprint" },
					{ value: "$0", label: "To publish your first catalog" },
				]}
			/>

			<Prose>
				<h2>Food and drink</h2>
				<p>
					Menus change more than any other kind of list. Suppliers raise prices,
					a dish sells out, a season ends. A digital menu absorbs all of that
					without a trip to the printer.
				</p>
				<ul>
					<li>
						<strong>Restaurants and cafes.</strong> The soup of the day is
						different every day, and the laminated menu cannot keep up. Put the
						menu online and you edit a line instead of reprinting a stack. This
						is the classic case, covered step by step in the{" "}
						<a href="/articles/digital-menu-for-restaurants">
							guide to digital menus for restaurants
						</a>
						.
					</li>
					<li>
						<strong>Food trucks and pop-ups.</strong> Your location moves by the
						day, so a fixed sign does not help anyone find you. A single link
						and QR travel with the truck, and the menu stays current wherever
						you park. Post the link in your stories and customers know what is
						on before they walk over.
					</li>
				</ul>

				<h2>Beauty and wellness</h2>
				<p>
					When the product is your time, the catalog is really a price list with
					durations attached. Customers want to know what a treatment costs and
					how long it takes before they book.
				</p>
				<ul>
					<li>
						<strong>Salons and spas.</strong> A client asks how much balayage
						costs and how long to set aside. Instead of typing the same answer
						again, you send a link with every service, its duration, and its
						price. There is a full walkthrough in the{" "}
						<a href="/articles/digital-service-menu-salons-spas">
							guide to digital service menus for salons and spas
						</a>
						.
					</li>
					<li>
						<strong>Gyms and studios.</strong> A prospective member wants the
						class timetable and the difference between membership tiers before
						they commit. Put the schedule, the tiers, and the personal training
						packages on one page and the front desk stops fielding the same
						three questions all week.
					</li>
				</ul>
			</Prose>

			<ArticleImage
				alt="Inside a cozy independent bookstore with books filling the shelves"
				caption="From a bookshop to a market stall, one simple catalog format fits them all."
				credit={{ name: "Unsplash", url: "https://unsplash.com" }}
				src="https://images.unsplash.com/photo-1757106406931-8b4de9ac7bb6?auto=format&fit=crop&w=1600&q=80"
			/>

			<Prose>
				<h2>Retail and makers</h2>
				<p>
					Stock turns over and seasons shift, so the list of what you sell is
					never finished. A page you can edit means the catalog matches the
					shelf instead of trailing behind it.
				</p>
				<ul>
					<li>
						<strong>Boutiques and retail shops.</strong> A new collection lands
						and the old one sells through. You add the new pieces with photos
						and prices and remove what is gone, no developer and no waiting. The
						link sits in your bio so people can browse the range before they
						visit.
					</li>
					<li>
						<strong>Artists and makers.</strong> At a craft market you cannot
						carry every piece, and the one a buyer wants is back in the studio.
						A clean portfolio with prices, shown from your phone or a QR on the
						table, lets them see the full body of work and reach you afterward.
					</li>
					<li>
						<strong>Florists.</strong> What is fresh this week sets what you can
						make, so a fixed catalog is wrong by Thursday. List seasonal
						arrangements and price points and swap them as the flowers change,
						with photos that show the real bouquets rather than stock images.
					</li>
				</ul>
			</Prose>

			<PullQuote cite="The pattern behind every entry on this list">
				Whatever changes most about your business is exactly what a printed list
				gets wrong.
			</PullQuote>

			<Prose>
				<h2>Property, events, and stays</h2>
				<p>
					These businesses sell something a customer wants to study before they
					commit, a home, a package, a room. The catalog is where they do that
					browsing, on their own time.
				</p>
				<ul>
					<li>
						<strong>Real estate agents.</strong> A buyer asks what you have in
						their budget and you do not want to send six separate attachments.
						One tidy set of listings with photos and key details, shareable as a
						single link, lets them scroll through everything in one place.
					</li>
					<li>
						<strong>Event planners.</strong> A lead messages on a Friday asking
						what you offer and what it costs. A page with packages, add-ons, and
						a few examples of past work lets you reply with one link while the
						interest is still warm.
					</li>
					<li>
						<strong>Hotels and B&amp;Bs.</strong> Guests want to see the rooms,
						the rates, and the on-site extras before they book direct rather
						than through a platform that takes a cut. A catalog of rooms and
						services gives them that, and the link goes straight into your
						confirmation emails.
					</li>
				</ul>
			</Prose>

			<ArticleCTA variant="mid" />

			<Prose>
				<h2>Services and community</h2>
				<p>
					Even businesses that do not sell objects benefit from a clear, public
					list. When people know what you offer and roughly what it costs, you
					spend less time explaining and more time working.
				</p>
				<ul>
					<li>
						<strong>Home services.</strong> A caller wants a rough price for a
						boiler service before they book a plumber, and you do not want to
						quote from scratch on every call. Listing your common jobs with
						starting prices sets expectations and filters out the calls that
						were never a fit.
					</li>
					<li>
						<strong>Schools, clubs, and nonprofits.</strong> Term programs,
						class options, or the items in a fundraiser all need to live
						somewhere parents and supporters can open without an account. A
						single page anyone can read on a phone does that, and you edit it as
						the term or the campaign moves on.
					</li>
				</ul>
			</Prose>

			<Prose>
				<h2>What they all have in common</h2>
				<p>
					Different as these businesses are, the need is the same. Things
					change, so the catalog has to be easy to update. People look on their
					phones, so it has to read well on a small screen. And sharing should
					be as simple as sending a link or pointing a camera at a code.
					Printing a new version every time something shifts is wasted money and
					wasted time.
				</p>
				<p>
					If you want to lean on the QR side of that, the{" "}
					<a href="/articles/qr-code-catalog-guide">
						guide to QR code catalogs
					</a>{" "}
					covers where to place a code so people actually scan it.
				</p>
			</Prose>

			<Callout title="How to start free in minutes" variant="tip">
				You do not need a designer or a developer. The steps below take a first
				catalog from nothing to a shareable link, and your first one does not
				cost anything.
			</Callout>

			<Stepper
				steps={[
					{
						title: "List what you offer most",
						description:
							"Pick the handful of items or services you sell most often. Write one short line for each with a price. Skip the long tail for now; you can add it later.",
					},
					{
						title: "Group it into a few categories",
						description:
							"Sort those lines into three or four clear sections, the way a menu has starters and mains. Clear groups make the page easy to scan on a phone.",
					},
					{
						title: "Let AI draft it, or import a list",
						description:
							"Rather not start from a blank page? Describe your business and let AI write the first version, covered in the guide to making a catalog with AI, or import a list you already keep.",
					},
					{
						title: "Add photos where they help",
						description:
							"A real photo of the dish, the bouquet, or the room does more than a paragraph. Add them where they earn their place and leave plain text where they do not.",
					},
					{
						title: "Publish, share, and edit anytime",
						description:
							"Publish to get a link and a QR code. Share them, then change a price or swap a photo whenever something moves. The page updates for everyone at once.",
					},
				]}
			/>

			<Prose>
				<p>
					That is the whole process. If you would rather see the AI route in
					detail first, the{" "}
					<a href="/articles/create-catalog-with-ai">
						guide to creating a catalog with AI
					</a>{" "}
					walks through it. Otherwise the only real step left is starting, and
					your first catalog is free.
				</p>
			</Prose>
		</>
	);
}

const article: Article = { meta, Body };
export default article;
