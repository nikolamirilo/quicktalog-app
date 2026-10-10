import type { ReactNode } from "react";

/** One section of a legal document, as a page defines it. */
export type LegalSectionContent = {
	/** Anchor id; the TOC links to it. */
	id: string;
	title: string;
	content: ReactNode;
};

/** A numbered section: the "01" badge, the title and the body. */
export function LegalSection({
	section,
	number,
}: {
	section: LegalSectionContent;
	number: number;
}) {
	return (
		<section
			aria-labelledby={`${section.id}-h`}
			className="mt-11 scroll-mt-[110px]"
			id={section.id}
		>
			<h2
				className="mb-3.5 flex items-baseline gap-3 text-[clamp(22px,2.4vw,27px)] font-extrabold leading-[1.2] tracking-[-0.025em] text-product-foreground"
				id={`${section.id}-h`}
			>
				<span className="inline-block flex-none -translate-y-[3px] rounded-lg border border-product-primary/40 bg-product-primary-soft px-2 py-1 font-product-body text-[12.5px] font-extrabold leading-none tracking-[0.04em] text-product-primary-ink">
					{String(number).padStart(2, "0")}
				</span>
				<span>{section.title}</span>
			</h2>
			{section.content}
		</section>
	);
}
