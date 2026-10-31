import { ManualSection } from "@/components/manual/ManualSection";
import { ManualText } from "@/components/manual/ManualText";
import { Option, Options } from "@/components/manual/Options";
import { manualGlossary } from "./glossary-terms";
import type { ManualPage } from "./_types";

const meta = {
	slug: "glossary",
	group: "reference",
	title: "Glossary",
	inShort: "What Quicktalog means by the words it uses.",
	keywords: ["glossary", "words", "terms", "meaning", "definitions"],
	synonyms: ["dictionary", "what does this mean", "terminology"],
	related: ["limits", "troubleshooting"],
} satisfies ManualPage["meta"];

function Body() {
	const terms = Object.entries(manualGlossary).sort(([a], [b]) =>
		a.localeCompare(b),
	);

	return (
		<>
			<ManualSection kind="info" title="Words you will meet">
				<ManualText className="mb-4">
					<p>
						Some of these are ordinary words that mean something particular in
						Quicktalog. Where a word is underlined with dots elsewhere in this
						manual, hovering it shows the same explanation.
					</p>
				</ManualText>
				<Options>
					{terms.map(([term, definition]) => (
						<Option key={term} name={term}>
							<p>{definition}</p>
						</Option>
					))}
				</Options>
			</ManualSection>
		</>
	);
}

const page: ManualPage = { Body, meta };
export default page;
