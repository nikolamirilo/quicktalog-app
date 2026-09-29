import { ArrowLeft } from "lucide-react";
import Link from "next/link";

/** Plain "← All articles" style link at the top of a resource page. */
export function ResourceBackLink({
	href,
	label,
}: {
	href: string;
	label: string;
}) {
	return (
		<Link
			className="group mb-1.5 inline-flex items-center gap-[7px] text-[14.5px] font-semibold text-product-foreground-accent transition-colors hover:text-product-foreground"
			href={href}
		>
			<ArrowLeft
				aria-hidden="true"
				className="h-4 w-4 transition-transform duration-200 group-hover:-translate-x-[3px]"
			/>
			{label}
		</Link>
	);
}
