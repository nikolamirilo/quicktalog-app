import type { ReactNode } from "react";

import { Eyebrow } from "@/components/general/Eyebrow";
import { cn } from "@/lib/ui/cn";

type SectionHeadingProps = {
	title: ReactNode;
	eyebrow?: ReactNode;
	description?: ReactNode;
	as?: "h1" | "h2" | "h3";
	align?: "center" | "left";
	size?: keyof typeof titleSizes;
	/** Lets the section point at its heading with `aria-labelledby`. */
	id?: string;
	className?: string;
};

const titleSizes = {
	md: "text-display-md",
	sm: "text-display-sm",
	title: "text-title-lg",
};

export function SectionHeading({
	title,
	eyebrow,
	description,
	as: Heading = "h2",
	align = "center",
	size = "md",
	id,
	className,
}: SectionHeadingProps) {
	return (
		<div
			className={cn(
				"mb-12 max-w-[780px]",
				align === "center" ? "mx-auto text-center" : "text-left",
				className,
			)}
		>
			{eyebrow && <Eyebrow className="mb-3">{eyebrow}</Eyebrow>}
			<Heading className={cn("text-balance", titleSizes[size])} id={id}>
				{title}
			</Heading>
			{description && (
				<p className="mt-4 text-lead-sm text-product-foreground-accent">
					{description}
				</p>
			)}
		</div>
	);
}
