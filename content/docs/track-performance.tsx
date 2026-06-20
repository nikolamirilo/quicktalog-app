import { FiBarChart2 } from "react-icons/fi";
import Callout from "@/components/articles/Callout";
import KeyTakeaways from "@/components/articles/KeyTakeaways";
import Prose from "@/components/articles/Prose";
import type { DocEntry } from "./_types";

const meta = {
	slug: "track-performance",
	title: "Track Performance with Analytics",
	description:
		"Read the analytics on each catalogue to see how many people view it, when they look, and what to do with that information.",
	tag: "Measure",
	icon: FiBarChart2,
	order: 6,
	readingTimeMinutes: 3,
	keywords: [
		"catalogue analytics",
		"track views",
		"catalogue performance",
		"customer engagement",
	],
	relatedSlugs: ["plans-and-billing", "share-your-catalogue"],
} satisfies DocEntry["meta"];

function Body() {
	return (
		<>
			<Prose>
				<p>
					Once a catalogue is live, you do not have to guess how it is doing.
					Each one has its own analytics, so you can see how much attention it
					gets and when. You do not need to be a data person to use it. A few
					simple numbers tell you most of what matters.
				</p>
			</Prose>

			<KeyTakeaways
				points={[
					"Every catalogue has its own analytics page.",
					"You see total views, your busiest day, and your average views per day.",
					"A chart shows daily views over time, so trends are easy to spot.",
					"Use the numbers to time your updates and promotions.",
				]}
			/>

			<Prose>
				<h2>What the numbers mean</h2>
				<p>
					Total views tell you how much your catalogue is being opened overall.
					The busiest day shows when interest peaked, which often lines up with
					a post, an email, or a sign going up. Average views per day give you a
					steady baseline to compare against, so you can tell a good week from a
					quiet one.
				</p>
				<p>
					The chart of daily views over time is where the story is. A steady
					line means steady interest. A spike points to something that worked,
					and a slow slide is a nudge to share the link again or refresh what is
					inside.
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

			<Callout title="Share the link to see movement" variant="tip">
				Views follow sharing. If a catalogue looks quiet, the fix is usually
				more places to find it, not more edits. Add the link to your social
				profiles, your email signature, and a QR code in your space, then watch
				the chart respond.
			</Callout>
		</>
	);
}

const doc: DocEntry = { meta, Body };
export default doc;
