import type { ReactNode } from "react";

/**
 * Short facts about what the product allows. Deliberately plain: readers read
 * these as rules, and a row of warning icons made them stop reading.
 */
export function Rules({ children }: { children: ReactNode }) {
	return (
		<ul className="grid max-w-[700px] gap-2.5 text-[15.5px] leading-[1.65] text-product-foreground-accent">
			{children}
		</ul>
	);
}

export function Rule({ children }: { children: ReactNode }) {
	return (
		<li className="grid grid-cols-[14px_minmax(0,1fr)] gap-x-2.5">
			<span
				aria-hidden="true"
				className="mt-[9px] h-[5px] w-[5px] rounded-full bg-product-border-hover"
			/>
			<span>{children}</span>
		</li>
	);
}
