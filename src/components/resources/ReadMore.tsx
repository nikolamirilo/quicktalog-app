import { ArrowRight } from "lucide-react";
import type { ReactNode } from "react";

/** "Read →" affordance at the foot of a resource card. The arrow nudges when the card (`group`) is hovered. */
export function ReadMore({ children = "Read" }: { children?: ReactNode }) {
	return (
		<span className="inline-flex items-center gap-1.5 text-[14.5px] font-bold text-product-foreground">
			{children}
			<ArrowRight
				aria-hidden="true"
				className="h-[15px] w-[15px] transition-transform duration-200 group-hover:translate-x-[3px]"
			/>
		</span>
	);
}
