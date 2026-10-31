import { manualGlossary } from "@/content/manual/glossary-terms";

/**
 * A word from the glossary, with its meaning on hover. Mark a term on its
 * first use on a page, not on every use.
 */
export function Term({ name }: { name: keyof typeof manualGlossary }) {
	return (
		<span
			className="cursor-help underline decoration-product-border-hover decoration-dotted decoration-2 underline-offset-[3px]"
			title={manualGlossary[name]}
		>
			{name}
		</span>
	);
}
