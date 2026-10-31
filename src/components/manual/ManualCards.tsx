import { ArrowRight, type LucideIcon } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

import {
	type SectionKind,
	sectionKinds,
} from "@/components/manual/sectionKinds";
import { cn } from "@/lib/ui/cn";

export function Cards({
	children,
	columns = 2,
}: {
	children: ReactNode;
	columns?: 2 | 3;
}) {
	return (
		<div
			className={cn(
				"grid gap-3.5 sm:grid-cols-2",
				columns === 3 && "lg:grid-cols-3",
			)}
		>
			{children}
		</div>
	);
}

/** A link to another page of the manual, with its module colour. */
export function CardLink({
	href,
	icon: Icon,
	kind = "info",
	title,
	count,
	children,
}: {
	href: string;
	icon: LucideIcon;
	kind?: SectionKind;
	title: string;
	/** How many pages the module holds. */
	count?: number;
	children: ReactNode;
}) {
	return (
		<Link
			className="group flex flex-col gap-2 rounded-product-card border border-product-border bg-product-card p-[18px] transition-colors hover:border-product-primary/60"
			href={href}
		>
			<span
				aria-hidden="true"
				className={cn(
					"grid h-[34px] w-[34px] place-items-center rounded-[11px] [&_svg]:h-[17px] [&_svg]:w-[17px]",
					sectionKinds[kind].tile,
				)}
			>
				<Icon />
			</span>
			<span className="flex items-baseline gap-2">
				<span className="font-product-heading text-[16px] font-bold leading-[1.3] text-product-foreground">
					{title}
				</span>
				{count ? (
					<span className="text-[12px] font-semibold text-product-muted">
						{count} {count === 1 ? "page" : "pages"}
					</span>
				) : null}
			</span>
			<span className="text-[14.5px] leading-[1.5] text-product-foreground-accent">
				{children}
			</span>
		</Link>
	);
}

/** A card for a job the reader wants done, pointing at a tutorial. */
export function GoalCard({
	href,
	goal,
	children,
}: {
	href: string;
	/** Written the way a reader would say it: "I want to put my menu online". */
	goal: string;
	children: ReactNode;
}) {
	return (
		<Link
			className="group flex items-start gap-3 rounded-product-card border border-product-primary/45 bg-product-amber-panel p-[18px] transition-colors hover:border-product-primary"
			href={href}
		>
			<span className="min-w-0 flex-1">
				<span className="block font-product-heading text-[15.5px] font-bold leading-[1.3] text-product-foreground">
					{goal}
				</span>
				<span className="mt-1 block text-[14px] leading-[1.5] text-product-foreground-accent">
					{children}
				</span>
			</span>
			<ArrowRight
				aria-hidden="true"
				className="mt-1 h-4 w-4 flex-none text-product-primary-ink transition-transform group-hover:translate-x-[3px]"
			/>
		</Link>
	);
}
