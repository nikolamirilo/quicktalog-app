import { Clock, Scissors } from "lucide-react";

import type { CoverDefinition } from "@/components/articles/covers/types";

const rows = [
	{ name: "Cut & finish", time: "45 min", price: "$48" },
	{ name: "Full colour", time: "90 min", price: "$95" },
	{ name: "Hot stone massage", time: "60 min", price: "$70" },
];

/** A short salon price list with durations. */
export const salonsCover: CoverDefinition = {
	background:
		"bg-[radial-gradient(80%_90%_at_50%_40%,#fdebe3_0%,#fff7f2_60%,#fbede6_100%)]",
	chip: { icon: Scissors, label: "Services" },
	Art: () => (
		<div className="w-full max-w-[300px] rounded-2xl border border-[#f0ddd3] bg-white px-3 py-2 shadow-product-hover">
			{rows.map((row) => (
				<p
					className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-2.5 border-b border-dashed border-[#f0ddd3] py-2 last:border-b-0"
					key={row.name}
				>
					<b className="truncate text-[13px] text-product-foreground">
						{row.name}
					</b>
					<small className="row-start-2 inline-flex items-center gap-1 text-[11.5px] text-product-muted">
						<Clock className="h-3.5 w-3.5" />
						{row.time}
					</small>
					<em className="col-start-2 row-span-2 row-start-1 self-center font-product-heading text-[15px] font-extrabold not-italic leading-none text-product-foreground">
						{row.price}
					</em>
				</p>
			))}
		</div>
	),
};
