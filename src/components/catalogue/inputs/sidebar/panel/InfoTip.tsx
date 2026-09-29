"use client";

import { Info } from "lucide-react";
import type { ReactNode } from "react";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";

/**
 * The (i) button next to a panel heading or field. A popover rather than a
 * tooltip, so it opens on tap as well as on click. The visible dot is small;
 * the hit area around it is 44px.
 */
export const InfoTip = ({
	label,
	children,
}: {
	/** What the tip is about: the button reads "About {label}". */
	label: string;
	children: ReactNode;
}) => (
	<Popover>
		<PopoverTrigger
			aria-label={`About ${label}`}
			className="relative inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-product-muted transition-colors before:absolute before:-inset-2 before:content-[''] hover:bg-product-background-hero hover:text-product-foreground data-[state=open]:bg-product-background-hero data-[state=open]:text-product-foreground"
			type="button"
		>
			<Info aria-hidden="true" className="h-4 w-4" />
		</PopoverTrigger>
		<PopoverContent
			align="start"
			className="z-[2000] w-64 max-w-[calc(100vw-32px)] p-3 text-[13px] leading-relaxed text-product-foreground-accent"
			collisionPadding={16}
			side="top"
		>
			{children}
		</PopoverContent>
	</Popover>
);
