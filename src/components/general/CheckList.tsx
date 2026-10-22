import { Check } from "lucide-react";

import { cn } from "@/lib/ui/cn";

/** Inline row of short reassurances, each with an amber check. */
export function CheckList({
	items,
	className,
	iconClassName,
	"aria-label": ariaLabel,
}: {
	items: string[];
	className?: string;
	iconClassName?: string;
	"aria-label"?: string;
}) {
	return (
		<ul
			aria-label={ariaLabel}
			className={cn(
				"flex flex-wrap justify-center gap-x-[18px] gap-y-1.5 text-sm text-product-muted",
				className,
			)}
		>
			{items.map((item) => (
				<li className="inline-flex items-center gap-1.5" key={item}>
					<Check
						aria-hidden="true"
						className={cn(
							"h-[15px] w-[15px] flex-none text-product-primary-ink",
							iconClassName,
						)}
					/>
					{item}
				</li>
			))}
		</ul>
	);
}
