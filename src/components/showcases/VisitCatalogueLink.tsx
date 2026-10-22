import { ExternalLink } from "lucide-react";

import { Button } from "@/components/ui/button";

/** "Visit Catalogue" button that opens the live catalogue in a new tab. */
export function VisitCatalogueLink({
	src,
	className,
	size,
}: {
	src: string;
	className?: string;
	size?: "default" | "lg";
}) {
	return (
		<Button asChild className={className} size={size}>
			<a href={src} rel="noopener noreferrer" target="_blank">
				Visit Catalogue
				<ExternalLink aria-hidden="true" />
				<span className="sr-only">(opens in a new tab)</span>
			</a>
		</Button>
	);
}
