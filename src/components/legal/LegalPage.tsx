import type { ReactNode } from "react";

import { Container } from "@/components/general/Container";
import { LegalContactBox } from "@/components/legal/LegalContactBox";
import { LegalHero } from "@/components/legal/LegalHero";
import {
	LegalSection,
	type LegalSectionContent,
} from "@/components/legal/LegalSection";
import { LegalToc } from "@/components/legal/LegalToc";
import { readingMinutes } from "@/components/legal/readingTime";
import type { LegalDocumentKey } from "@/constants/legal";
import { cn } from "@/lib/ui/cn";

/**
 * Body copy styling. It is applied by descendant selectors so the documents
 * stay plain `<p>`, `<ul>` and `<strong>`; links carry `textLinkClass`.
 */
const PROSE = cn(
	"text-[17px] leading-[1.75] text-product-foreground-accent [overflow-wrap:break-word]",
	"[&_p+p]:mt-3.5 [&_p+ul]:mt-3.5 [&_ul+p]:mt-3.5",
	"[&_ul]:mt-3.5 [&_ul]:list-none [&_ul]:p-0",
	"[&_li]:relative [&_li]:mt-2.5 [&_li]:pl-6",
	"[&_li]:before:absolute [&_li]:before:left-[5px] [&_li]:before:top-[0.72em] [&_li]:before:size-[7px] [&_li]:before:rounded-full [&_li]:before:bg-product-primary [&_li]:before:content-['']",
	"[&_strong]:font-semibold [&_strong]:text-product-foreground",
);

/**
 * The shared layout of the Terms, Privacy and Refund pages: a hero with the
 * document tabs and meta pills, a sticky table of contents, numbered sections
 * at a 70ch measure, and a closing contact box. The reading time is counted
 * from the document's own text.
 */
export function LegalPage({
	current,
	title,
	updated,
	lead,
	intro,
	sections,
}: {
	current: LegalDocumentKey;
	title: string;
	/** ISO date (YYYY-MM-DD) the document last changed. */
	updated: string;
	lead: ReactNode;
	/** Shown between the lead and the first section, such as a callout. */
	intro?: ReactNode;
	sections: LegalSectionContent[];
}) {
	const readMinutes = readingMinutes(
		lead,
		intro,
		sections.map((section) => [section.title, section.content]),
	);

	return (
		<div>
			<LegalHero
				current={current}
				readMinutes={readMinutes}
				sectionCount={sections.length}
				title={title}
				updated={updated}
			/>

			<Container>
				<div className="grid max-w-[1180px] grid-cols-[minmax(0,1fr)] gap-7 pb-[72px] pt-7 lg:grid-cols-[260px_minmax(0,1fr)] lg:gap-16 lg:pb-24 lg:pt-14">
					<LegalToc
						items={sections.map((section, index) => ({
							id: section.id,
							label: `${index + 1}. ${section.title}`,
						}))}
					/>
					<article className="min-w-0 max-w-[70ch]">
						<div className={PROSE}>
							<p className="text-[clamp(18px,1.6vw,20px)] leading-[1.6] text-product-foreground">
								{lead}
							</p>
							{intro}
							{sections.map((section, index) => (
								<LegalSection
									key={section.id}
									number={index + 1}
									section={section}
								/>
							))}
						</div>
						<LegalContactBox current={current} />
					</article>
				</div>
			</Container>
		</div>
	);
}
