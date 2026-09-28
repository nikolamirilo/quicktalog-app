import { ArrowLeft } from "lucide-react";
import Link from "next/link";

/**
 * Pill-style back link used at the top of docs and article pages. Reads as a
 * deliberate control rather than floating text, and matches the rounded chip
 * styling used in the page heroes.
 */
export default function BackLink({
	href,
	label,
}: {
	href: string;
	label: string;
}) {
	return (
		<Link
			className="group inline-flex items-center gap-2 rounded-full border border-product-border bg-product-background px-4 py-2 text-sm font-semibold text-product-foreground-accent shadow-sm transition-all hover:border-product-primary hover:text-product-foreground hover:shadow-md"
			href={href}
		>
			<ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
			{label}
		</Link>
	);
}
