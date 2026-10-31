import {
	Children,
	cloneElement,
	isValidElement,
	type ReactElement,
	type ReactNode,
} from "react";

import { SpotRef } from "@/components/manual/Screen";

/**
 * Numbered how-to steps. One action per step: the title is the action, named
 * the way the screen names it.
 *
 * Numbering is handed down rather than drawn with a CSS counter, because a
 * follow-along step also has to tell the screen which marker to light up.
 */
export function Steps({ children }: { children: ReactNode }) {
	const steps = Children.toArray(children).filter(isValidElement);

	return (
		<ol className="grid gap-5">
			{steps.map((step, index) =>
				cloneElement(step as ReactElement<{ index?: number }>, {
					index: index + 1,
				}),
			)}
		</ol>
	);
}

export function Step({
	title,
	done,
	spot,
	index = 1,
	children,
}: {
	title: ReactNode;
	/** How the reader knows it worked. */
	done?: ReactNode;
	/** The hotspot on the screen above this step, in a follow-along block. */
	spot?: number;
	/** Set by `Steps`. */
	index?: number;
	children?: ReactNode;
}) {
	return (
		<li className="grid grid-cols-[28px_minmax(0,1fr)] gap-x-3 gap-y-1.5">
			{spot ? (
				<SpotRef label={`Step ${index}`} n={spot}>
					{index}
				</SpotRef>
			) : (
				<span
					aria-hidden="true"
					className="mt-[1px] grid h-[26px] w-[26px] place-items-center rounded-full bg-product-primary font-product-heading text-[13px] font-extrabold leading-none text-product-foreground"
				>
					{index}
				</span>
			)}
			<div className="min-w-0">
				<p className="font-semibold text-product-foreground">{title}</p>
				{children ? (
					<div className="mt-1 max-w-[640px] text-[15.5px] leading-[1.65] text-product-foreground-accent [&>p+p]:mt-2">
						{children}
					</div>
				) : null}
				{done ? (
					<p className="mt-2 flex items-start gap-2 rounded-xl bg-product-success-soft px-3 py-2 text-[14.5px] text-product-foreground-accent">
						<span
							aria-hidden="true"
							className="mt-[2px] font-bold text-product-success"
						>
							&#10003;
						</span>
						<span>{done}</span>
					</p>
				) : null}
			</div>
		</li>
	);
}
