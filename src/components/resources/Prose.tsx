import type { ReactNode } from "react";

/**
 * Typography for a run of article or doc body text (paragraphs, headings,
 * lists). The one place prose styling lives. Blocks between runs (takeaways,
 * stats, callouts, ...) sit next to it inside `ProseBody`, which sets the
 * reading measure and the vertical rhythm between them.
 */
export function Prose({ children }: { children: ReactNode }) {
	return (
		<div
			className="
				[&>*+*]:mt-[18px]
				[&>h2]:mt-12 [&>h2]:scroll-mt-[104px] [&>h2]:text-balance [&>h2]:text-[clamp(24px,2.6vw,30px)] [&>h2]:font-extrabold [&>h2]:tracking-[-0.025em] [&>h2]:text-product-foreground
				[&>h3]:mt-7 [&>h3]:scroll-mt-[104px] [&>h3]:text-[19px] [&>h3]:font-bold [&>h3]:tracking-[-0.015em] [&>h3]:text-product-foreground
				[&>h2+p]:mt-3 [&>h3+p]:mt-3 [&>h3+ul]:mt-3
				[&>ul]:grid [&>ul]:list-none [&>ul]:gap-2.5 [&>ul]:p-0
				[&>ul>li]:relative [&>ul>li]:pl-[22px]
				[&>ul>li]:before:absolute [&>ul>li]:before:left-1 [&>ul>li]:before:top-[0.72em] [&>ul>li]:before:h-[7px] [&>ul>li]:before:w-[7px] [&>ul>li]:before:rounded-full [&>ul>li]:before:bg-product-primary [&>ul>li]:before:content-['']
				[&>ol]:list-decimal [&>ol]:pl-6 [&>ol>li+li]:mt-2.5 [&>ol>li]:pl-1 [&>ol>li]:marker:font-bold [&>ol>li]:marker:text-product-primary-ink
				[&>blockquote]:border-l-4 [&>blockquote]:border-product-primary [&>blockquote]:pl-5 [&>blockquote]:text-product-foreground
				[&>hr]:my-12 [&>hr]:border-product-border
				[&_code]:rounded-md [&_code]:bg-product-background-hero [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-[0.9em]
				[&_strong]:font-semibold [&_strong]:text-product-foreground
			"
		>
			{children}
		</div>
	);
}
