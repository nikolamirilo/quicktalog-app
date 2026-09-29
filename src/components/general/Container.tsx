import type { ElementType, ReactNode } from "react";

import { cn } from "@/lib/ui/cn";

/** The 1280px page column with the standard side gutter. */
export function Container({
	children,
	className,
	as: Tag = "div",
	id,
}: {
	children: ReactNode;
	className?: string;
	as?: ElementType;
	id?: string;
}) {
	return (
		<Tag
			className={cn("mx-auto w-full max-w-[1280px] px-5", className)}
			id={id}
		>
			{children}
		</Tag>
	);
}
