import { AlertTriangle, Info } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/ui/cn";

/** An aside inside a legal section: amber for information, red for a warning. */
export function LegalCallout({
	children,
	tone = "info",
}: {
	children: ReactNode;
	tone?: "info" | "danger";
}) {
	const Icon = tone === "danger" ? AlertTriangle : Info;
	return (
		<div
			className={cn(
				"mt-[26px] flex items-start gap-3 rounded-2xl border px-[18px] py-4 text-base font-medium leading-[1.6] text-product-foreground",
				tone === "danger"
					? "border-product-error/[0.28] bg-product-error-soft"
					: "border-product-primary/45 bg-product-primary-soft",
			)}
		>
			<Icon
				aria-hidden="true"
				className={cn(
					"mt-[3px] size-5 flex-none",
					tone === "danger" ? "text-product-error" : "text-product-primary-ink",
				)}
			/>
			<p>{children}</p>
		</div>
	);
}
