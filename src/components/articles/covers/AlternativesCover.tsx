import { Check } from "lucide-react";

import type { CoverDefinition } from "@/components/articles/covers/types";

const crossedOut = ["PDF", "Canva", "Flipbook", "WordPress"];

/** The usual tools struck through, and a web catalogue picked. */
export const alternativesCover: CoverDefinition = {
	background:
		"bg-[radial-gradient(80%_90%_at_50%_40%,#eef0f8_0%,#f7f8fc_60%,#f2f3f9_100%)]",
	Art: () => (
		<div className="flex max-w-[320px] flex-wrap justify-center gap-2">
			{crossedOut.map((name) => (
				<span
					className="inline-flex items-center rounded-xl border border-dashed border-product-border-strong bg-white px-[13px] py-2 text-[13px] font-semibold text-product-muted line-through decoration-product-error/50"
					key={name}
				>
					{name}
				</span>
			))}
			<span className="inline-flex items-center gap-1.5 rounded-xl border-[1.5px] border-product-primary bg-product-primary-soft px-[13px] py-2 text-[13px] font-bold text-product-foreground shadow-product-primary">
				<Check className="h-3.5 w-3.5" />
				Web catalogue
			</span>
		</div>
	),
};
