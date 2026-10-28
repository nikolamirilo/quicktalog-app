import type { ReactNode } from "react";

import {
	type SectionKind,
	sectionKinds,
} from "@/components/manual/sectionKinds";
import { cn } from "@/lib/ui/cn";

const slugify = (value: string) =>
	value
		.toLowerCase()
		.trim()
		.replace(/[^\w\s-]/g, "")
		.replace(/\s+/g, "-")
		.slice(0, 60);

/**
 * One section of a manual page. The heading is an h2, so it reaches the
 * "On this page" rail, and its id is stable enough to link to.
 */
export function ManualSection({
	kind,
	title,
	id,
	children,
	className,
}: {
	kind: SectionKind;
	title: string;
	id?: string;
	children: ReactNode;
	className?: string;
}) {
	const { icon: Icon, tile } = sectionKinds[kind];

	return (
		<section className={cn("mt-12 first:mt-8 scroll-mt-28", className)}>
			<h2
				className="flex items-center gap-2.5 font-product-heading text-[20px] font-extrabold leading-[1.25] tracking-[-0.01em] text-product-foreground"
				id={id ?? slugify(title)}
			>
				<span
					aria-hidden="true"
					className={cn(
						"grid h-[30px] w-[30px] flex-none place-items-center rounded-[10px] [&_svg]:h-[16px] [&_svg]:w-[16px]",
						tile,
					)}
				>
					<Icon />
				</span>
				{title}
			</h2>
			<div className="mt-4">{children}</div>
		</section>
	);
}
