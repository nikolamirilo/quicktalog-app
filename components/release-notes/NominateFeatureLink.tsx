import { Lightbulb } from "lucide-react";
import Link from "next/link";

interface Props {
	className?: string;
}

export default function NominateFeatureLink({ className = "" }: Props) {
	return (
		<Link
			className={`inline-flex items-center gap-1.5 text-sm font-semibold text-product-secondary border-b border-transparent hover:border-product-secondary transition-colors ${className}`}
			href="/contact?subject=feature-request"
		>
			<Lightbulb
				aria-hidden
				className="h-3.5 w-3.5 flex-shrink-0 text-product-primary-accent"
			/>
			Nominate a feature
		</Link>
	);
}
