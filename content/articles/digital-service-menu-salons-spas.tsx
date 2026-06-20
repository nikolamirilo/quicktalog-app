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
	slug: "digital-service-menu-salons-spas",
	title: "The Digital Service Menu Every Salon and Spa Should Have",
	description:
		"Swap the out-of-date price photo in your bio for a digital service menu. Show services, prices, and durations, and update them in seconds.",
	category: "Use cases",
	keywords: [
		"digital menu for salons",
		"salon service menu",
		"spa price list online",
		"hair salon menu maker",
		"barber price list",
		"service catalog",
	],
	heroImage:
		"https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&w=1600&q=80",
	heroImageAlt: "Inside a bright, modern hair salon",
	heroCredit: { name: "Unsplash", url: "https://unsplash.com" },
	publishedAt: "2026-06-18",
	readingTimeMinutes: 6,
	author: "The Quicktalog Team",
	relatedSlugs: [
		"businesses-that-need-digital-catalog",
		"qr-code-catalog-guide",
	],
} satisfies Article["meta"];

function Body() {
	return (
		<>
			<Prose>
				<p>
					Most salons keep their price list in one of two places: a screenshot
					pinned to an Instagram profile, or a laminated card at the front desk.
					Both have the same flaw. The day you change a price or add a service,
					they are wrong, and fixing them means designing a new graphic or
					reprinting the card. In the meantime, clients message you to ask what
					a balayage costs, and you answer the same question for the tenth time
					this week.
				</p>
				<p>
					A digital service menu ends that. It is your full list of services,
					prices, and durations on a web page built for a phone, with a link you
					can share and a QR code you can put at the desk. Change a price once,
					and every client sees the new one. No designer, no reprint, no
					out-of-date screenshot.
				</p>
			</Prose>

			<KeyTakeaways
				points={[
					"A live menu link in your bio is always current, unlike a pinned price photo.",
					"Service menus need durations, packages, and tiered pricing that a food menu does not.",
					"Branding the menu to match your salon builds more trust than a plain list.",
					"You can publish a starter menu for free and update prices in seconds.",
					"Views tell you which services to feature and which to promote harder.",
				]}
			/>

			<Prose>
				<h2>A service menu is not a food menu</h2>
				<p>
					Services carry details a food menu never has to show. A cut and a
					colour take different amounts of time, and a client wants to know that
					before they book. A massage might come in 30, 60, and 90 minute
					versions, each at its own price. Packages bundle a few services into
					one number. A bridal trial is priced differently from the wedding day
					itself.
				</p>
				<p>
					A good service menu makes all of that obvious, so a client knows what
					they are booking and how long it takes before they ever message you.
					That is the difference between a list of names and a menu that
					actually answers questions.
				</p>
				<ul>
					<li>
						<strong>Duration</strong> next to each service, so the calendar
						maths is done for them.
					</li>
					<li>
						<strong>Tiered pricing</strong> for short, medium, and long hair, or
						junior and senior stylists.
					</li>
					<li>
						<strong>Packages</strong> that group a few treatments at a set
						price.
					</li>
					<li>
						<strong>A short line</strong> on what a treatment includes and who
						it suits.
					</li>
				</ul>
			</Prose>

			<StatHighlights
				stats={[
					{ value: "30 sec", label: "to update a price across the whole menu" },
					{ value: "$0", label: "to publish your first service catalog" },
					{ value: "1 link", label: "in your bio that is never out of date" },
				]}
			/>

			<ArticleImage
				alt="Inside a modern hair salon with styling chairs and mirrors"
				caption="A polished space deserves a service menu that looks just as current."
				credit={{ name: "Unsplash", url: "https://unsplash.com" }}
				src="https://images.unsplash.com/photo-1706629503720-13cad35ce2e5?auto=format&fit=crop&w=1600&q=80"
			/>

			<Prose>
				<h2>Build your service catalog</h2>
				<p>
					You do not need to plan this for an afternoon. Work through it in
					order, and the menu takes shape as you go.
				</p>
			</Prose>

			<Stepper
				steps={[
					{
						title: "Group services into categories",
						description:
							"Sort by how clients ask for things: hair, colour, treatments, add-ons, or whatever fits your place. Clear groups make a long list easy to scan on a small screen.",
					},
					{
						title: "Add prices and durations",
						description:
							"List each service with its price and how long it takes. Use tiers where a service varies by hair length or stylist level, so the number a client sees is the number they pay.",
					},
					{
						title: "Write a line for anything that needs it",
						description:
							"A short note on what a treatment includes, or who it suits, saves a back-and-forth message. Keep it to one or two sentences.",
					},
					{
						title: "Add a photo to your signature services",
						description:
							"A real result photo on your hero treatments helps people picture what they are booking and nudges them toward the higher-value services.",
					},
					{
						title: "Brand it to match the salon",
						description:
							"Add your logo and set the colours to your own. A menu that looks like your salon reads as professional, not like a generic spreadsheet.",
					},
					{
						title: "Share the link and print the QR code",
						description:
							"Publish to get a link and a QR code. Put the QR at the front desk and in the window, and drop the link in your Instagram and TikTok bio.",
					},
				]}
			/>

			<Prose>
				<p>
					If typing it all out feels like a chore, describe your salon and let
					the AI generator draft the structure for you, then adjust the prices
					and wording. You are editing instead of starting from nothing. Either
					way, you end up with a real menu rather than another flat image.
				</p>
			</Prose>

			<ProsCons
				cons={[
					"Goes stale the first time a price changes",
					"Cannot show duration or package detail well",
					"Needs a new graphic for every edit",
					"Tells you nothing about what clients look at",
				]}
				consLabel="A pinned photo"
				pros={[
					"Updates the second you change a price",
					"Shows durations, tiers, and packages clearly",
					"Carries your logo and colours",
					"Tells you which services get the most views",
				]}
				prosLabel="A live menu"
				title="The pinned price photo versus a live menu"
			/>

			<Callout title="The link-in-bio fix" variant="tip">
				That pinned price photo in your bio works until the first price change.
				A live link does not. Swap the photo for your menu link, and your prices
				stay current without you touching the design again. It is the one change
				that pays off every time a follower from Instagram or TikTok taps
				through to see what you charge.
			</Callout>

			<PullQuote cite="Why a live link beats a laminated card">
				A menu that updates itself answers the price question before it ever
				reaches your inbox.
			</PullQuote>

			<ArticleCTA variant="mid" />

			<Prose>
				<h2>Update prices and seasonal offers without a designer</h2>
				<p>
					Putting up prices in the new year used to mean a new graphic and a new
					printed card. With a digital menu you edit the numbers and save. The
					change is live for everyone at once, on the QR at the desk and the
					link in your bio.
				</p>
				<p>
					Seasonal work is just as easy. Add a holiday package or a back-to-work
					colour offer when the season starts, then remove it when it ends. You
					can run a one-week promotion without committing to a reprint you will
					regret. None of this needs a designer, which is the whole point.
				</p>

				<h2>Use views to promote your best work</h2>
				<p>
					Once your menu is online, you can see which services get the most
					attention. If a treatment you are proud of is being overlooked, that
					is a signal to feature it, photograph it, or talk about it more in
					your posts. If something is quietly pulling a lot of views, you know
					where demand already is, and you can build an offer around it.
				</p>
				<p>
					You are no longer guessing about what clients are curious about. The
					menu does quiet work for you between appointments. It answers the
					price question before it reaches your inbox, it looks the part, and it
					is ready to share the moment someone asks what you offer. If you are
					still deciding whether this fits your business, see{" "}
					<a href="/articles/businesses-that-need-digital-catalog">
						which businesses get the most out of a digital catalog
					</a>{" "}
					and how to{" "}
					<a href="/articles/qr-code-catalog-guide">
						put a QR code to work at the front desk
					</a>
					.
				</p>
			</Prose>
		</>
	);
}

const article: Article = { meta, Body };
export default article;
