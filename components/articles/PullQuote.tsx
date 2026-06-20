import type { ReactNode } from "react";

/** Large editorial pull quote that breaks up long stretches of body text. */
export default function PullQuote({
	children,
	cite,
}: {
	children: ReactNode;
	cite?: string;
}) {
	return (
		<figure className="my-10">
			<blockquote className="border-l-4 border-product-primary pl-6">
				<p className="font-lora text-2xl font-bold leading-snug text-product-foreground sm:text-[1.75rem]">
					{children}
				</p>
			</blockquote>
			{cite && (
				<figcaption className="mt-3 pl-6 text-sm text-product-foreground-accent">
					{cite}
				</figcaption>
			)}
		</figure>
	);
}
