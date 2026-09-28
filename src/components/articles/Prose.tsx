import type { ReactNode } from "react";

/**
 * Typography wrapper for article body text. The single place where article
 * prose styling lives. Built from the product-* design tokens, the display
 * serif for headings, and brand amber for list markers and the link underline.
 */
export default function Prose({ children }: { children: ReactNode }) {
	return (
		<div
			className="
				max-w-none text-product-foreground leading-relaxed
				[&>h2]:font-lora [&>h2]:text-2xl [&>h2]:sm:text-[2rem] [&>h2]:font-bold [&>h2]:leading-tight [&>h2]:mt-14 [&>h2]:mb-4 [&>h2]:scroll-mt-28 [&>h2]:text-product-foreground
				[&>h3]:font-lora [&>h3]:text-xl [&>h3]:font-bold [&>h3]:mt-9 [&>h3]:mb-3 [&>h3]:text-product-foreground
				[&>p]:mb-5 [&>p]:text-[1.125rem] [&>p]:leading-[1.85]
				[&>ul]:list-disc [&>ul]:pl-6 [&>ul]:mb-6 [&>ul]:text-[1.125rem] [&>ul>li]:mb-2.5 [&>ul>li]:pl-1.5 [&>ul>li]:marker:text-product-primary
				[&>ol]:list-decimal [&>ol]:pl-6 [&>ol]:mb-6 [&>ol]:text-[1.125rem] [&>ol>li]:mb-2.5 [&>ol>li]:pl-1.5 [&>ol>li]:marker:font-bold [&>ol>li]:marker:text-product-secondary
				[&>blockquote]:my-7 [&>blockquote]:border-l-4 [&>blockquote]:border-product-primary [&>blockquote]:pl-5 [&>blockquote]:font-lora [&>blockquote]:text-xl [&>blockquote]:italic [&>blockquote]:text-product-foreground
				[&>hr]:my-12 [&>hr]:border-product-border
				[&_code]:rounded-md [&_code]:bg-product-background-hero [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:text-[0.95em]
				[&_strong]:font-semibold [&_strong]:text-product-foreground
				[&_a]:font-semibold [&_a]:text-product-foreground [&_a]:underline [&_a]:decoration-2 [&_a]:underline-offset-2 [&_a]:decoration-product-primary hover:[&_a]:text-product-secondary
			"
		>
			{children}
		</div>
	);
}
