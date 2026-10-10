import { Lightbulb } from "lucide-react";

import { TextLink } from "@/components/general/TextLink";
import { cn } from "@/lib/ui/cn";

export function NominateFeatureLink({ className }: { className?: string }) {
	return (
		<TextLink
			className={cn("inline-flex items-center gap-[7px]", className)}
			href="/contact?subject=feature-request"
		>
			<Lightbulb
				aria-hidden="true"
				className="h-[15px] w-[15px] text-product-primary-ink"
			/>
			Nominate a feature
		</TextLink>
	);
}
