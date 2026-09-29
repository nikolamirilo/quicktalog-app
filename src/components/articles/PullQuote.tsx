import type { ReactNode } from "react";

/** Large editorial pull quote that breaks up long stretches of body text. */
export function PullQuote({
	children,
	cite,
}: {
	children: ReactNode;
	cite?: string;
}) {
	return (
		<figure className="!my-8 border-l-4 border-product-primary py-1.5 pl-[22px]">
			<blockquote>
				<p className="text-balance font-product-heading text-[clamp(21px,2.3vw,26px)] font-extrabold leading-[1.3] tracking-[-0.02em] text-product-foreground">
					{children}
				</p>
			</blockquote>
			{cite && (
				<figcaption className="mt-2.5 text-sm text-product-muted">
					<span aria-hidden="true">— </span>
					{cite}
				</figcaption>
			)}
		</figure>
	);
}
