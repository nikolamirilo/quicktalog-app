import { UtensilsCrossed } from "lucide-react";

import {
	type CoverDefinition,
	warmBackground,
} from "@/components/articles/covers/types";
import { MiniCataloguePage } from "@/components/resources/MiniCataloguePage";

/** A phone showing the sample café menu. */
export const restaurantsCover: CoverDefinition = {
	background: warmBackground,
	chip: { icon: UtensilsCrossed, label: "Menu" },
	Art: () => (
		<div className="w-[180px] max-w-[70%] -rotate-[4deg] rounded-[24px] border-[6px] border-[#1c1a15] bg-[#fbf6ee] px-[3px] pb-1.5 pt-3.5 shadow-[0_24px_40px_-18px_rgba(22,20,15,0.5)]">
			<MiniCataloguePage showCta={false} />
		</div>
	),
};
