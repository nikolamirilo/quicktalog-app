import { FiBarChart2 } from "react-icons/fi";
import { ArticleImage } from "@/components/resources/ArticleImage";
import { Callout } from "@/components/resources/Callout";
import { KeyTakeaways } from "@/components/resources/KeyTakeaways";
import { Prose } from "@/components/resources/Prose";
import type { DocEntry } from "./_types";

const meta = {
	slug: "track-performance",
	title: "Track Performance with Analytics",
	description:
		"Read the analytics on each catalogue: views and visitors over 7, 30 or 90 days, how that compares with the period before, and what to do about it.",
	tag: "Measure",
	icon: FiBarChart2,
	order: 7,
	readingTimeMinutes: 4,
	keywords: [
		"catalogue analytics",
		"track views",
		"unique visitors",
		"catalogue performance",
		"Google Analytics catalogue",
	],
	relatedSlugs: ["plans-and-billing", "share-your-catalogue"],
} satisfies DocEntry["meta"];

function Body() {
	return (
		<>
			<ArticleImage
				alt="Quicktalog analytics dashboard showing catalogue views, busiest day, and a daily views chart"
				priority
				src="/images/documentation/track-performance-cover.svg"
			/>

			<Prose>
				<p>
					Once a catalogue is live, you do not have to guess how it is doing.
					Each one has its own analytics page, on every plan, and a switcher at
					the top moves between your catalogues without going back to the
					dashboard. You do not need to be a data person to use it. A few simple
					numbers tell you most of what matters.
				</p>
			</Prose>

			<KeyTakeaways
				points={[
					"Every catalogue has its own analytics page, over the last 7, 30 or 90 days.",
					"Four numbers: total views, unique visitors, your busiest day, and views per day.",
					"Each one is compared with the period before it, so you see the direction, not just the total.",
					"Page views also count towards your plan's monthly allowance.",
				]}
			/>

			<Prose>
				<h2>Pick a period</h2>
				<p>
					Everything on the page follows the range you choose at the top: the
					last 7, 30 or 90 days. Seven days is for checking whether something
					you did this week worked. Ninety is for seeing a season. Thirty is the
					sensible default and the one to leave it on.
				</p>

				<h2>What the numbers mean</h2>
				<p>
					<strong>Total views</strong> is how often your catalogue was opened.{" "}
					<strong>Unique visitors</strong> is how many different people did the
					opening, so the gap between the two tells you how much people come
					back. <strong>Your busiest day</strong> shows when interest peaked,
					which often lines up with a post, an email, or a sign going up. And{" "}
					<strong>views per day</strong> gives you a steady baseline, so you can
					tell a good week from a quiet one.
				</p>
				<p>
					Under each number is its change against the period before. A green
					rise on a 30-day view means the last 30 days beat the 30 before them.
					That comparison is usually more useful than the number itself, because
					it answers the question you actually had: is this going up?
				</p>
			</Prose>

			<ArticleImage
				alt="Catalogue analytics metrics: total views, unique visitors, busiest day, views per day, and a daily views chart"
				maxWidth="640px"
				src="/images/documentation/track-performance-metrics.svg"
			/>

			<Prose>
				<h2>The chart and the day-by-day list</h2>
				<p>
					The chart of daily views is where the story is. A steady line means
					steady interest. A spike points to something that worked, and a slow
					slide is a nudge to share the link again or refresh what is inside.
				</p>
				<p>
					Below it, a short table lists the most recent days one by one with
					their views and visitors, and marks the busiest day of the whole
					period. When the chart shows you a spike, this is where you find the
					date to match it against what you were doing.
				</p>

				<h2>Turn views into decisions</h2>
				<p>
					Analytics are only useful if they change what you do. If views jump
					every time you post the link, post it more often. If a quiet stretch
					follows a price rise, that is worth knowing. Watch the pattern over a
					few weeks rather than reacting to a single day, and let it guide when
					you update and when you promote.
				</p>
			</Prose>

			<ArticleImage
				alt="The analytics decision loop: read the chart, spot the pattern, update or promote, then watch it respond"
				src="/images/documentation/track-performance-decision-loop.svg"
			/>

			<Callout title="Share the link to see movement" variant="tip">
				Views follow sharing. If a catalogue looks quiet, the fix is usually
				more places to find it, not more edits. Add the link to your social
				profiles, your email signature, and a QR code in your space, then watch
				the chart respond.
			</Callout>

			<Prose>
				<h2>Views count towards your plan</h2>
				<p>
					Every plan includes a monthly page view allowance, shared across all
					your catalogues, and the Usage tab of your dashboard shows how much of
					it the current month has used. If you reach it, your catalogues go
					offline until the allowance resets at the start of the next month, or
					straight away if you upgrade. It is worth a glance whenever a
					catalogue starts doing unusually well.
				</p>

				<h2>Bring your own analytics</h2>
				<p>
					If you already run Google Analytics or a Meta Pixel, higher plans let
					you connect them to a catalogue from the General tab in the builder.
					Turn the one you use on, paste in its Measurement ID or Pixel ID, and
					your catalogue reports into the tools you already use, alongside the
					page here.
				</p>
				<p>
					Visitors are asked to allow analytics first, and nothing loads if they
					decline, so your catalogue stays on the right side of consent rules.
					Because you are collecting data through your own tools, mention them
					in your privacy policy.
				</p>
			</Prose>
		</>
	);
}

const doc: DocEntry = { meta, Body };
export default doc;
