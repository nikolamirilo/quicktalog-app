import { Check, Sparkles } from "lucide-react";

import type { CoverDefinition } from "@/components/articles/covers/types";

const replies = [
	'Added "Coffee" with 6 items',
	'Added "Pastries" with 5 items',
];

/** A dark chat: the prompt, then the builder's replies. */
export const aiCover: CoverDefinition = {
	background: "bg-[radial-gradient(80%_90%_at_70%_20%,#3a3222_0%,#1a1711_70%)]",
	chip: { icon: Sparkles, label: "Ask AI" },
	dark: true,
	Art: () => (
		<div className="grid w-full max-w-[300px] gap-2 text-[12.5px] leading-[1.4]">
			<p className="max-w-[85%] justify-self-end rounded-[14px_14px_4px_14px] bg-white px-3 py-[9px] text-product-foreground">
				A cosy café with coffee, pastries and brunch
			</p>
			{replies.map((line) => (
				<p
					className="flex items-center gap-1.5 justify-self-start rounded-[14px] border border-white/[0.12] bg-white/[0.08] px-3 py-[9px] font-semibold text-[#9ee6b8]"
					key={line}
				>
					<Check className="h-3.5 w-3.5" />
					{line}
				</p>
			))}
		</div>
	),
};
