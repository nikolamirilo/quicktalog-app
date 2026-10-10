import { DocCard } from "@/components/docs/DocCard";
import { Container } from "@/components/general/Container";
import { SectionHeading } from "@/components/general/SectionHeading";
import type { DocEntry } from "@/content/docs/_types";

/** Related topics shown after the doc grid. */
export function RelatedDocs({
	docs,
	total,
}: {
	docs: DocEntry[];
	total: number;
}) {
	if (!docs.length) return null;

	return (
		<section aria-labelledby="related-docs-heading" className="pb-6 pt-16">
			<Container>
				<SectionHeading
					align="left"
					className="mb-[22px]"
					eyebrow="Keep going"
					id="related-docs-heading"
					size="sm"
					title="More from the docs"
				/>
				<div className="grid grid-cols-1 gap-[18px] md:grid-cols-2 lg:grid-cols-3 lg:gap-[22px]">
					{docs.map((doc) => (
						<DocCard key={doc.meta.slug} meta={doc.meta} total={total} />
					))}
				</div>
			</Container>
		</section>
	);
}
