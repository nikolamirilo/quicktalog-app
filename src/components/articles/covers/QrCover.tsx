import { QrCode } from "lucide-react";

import type { CoverDefinition } from "@/components/articles/covers/types";
import { cn } from "@/lib/ui/cn";

const finders = ["left-1 top-1", "right-1 top-1", "bottom-1 left-1"];

/** A branded QR table card. */
export const qrCover: CoverDefinition = {
	background:
		"bg-[radial-gradient(80%_90%_at_50%_40%,#ffe6b0_0%,#fff4dc_60%,#fff8ea_100%)]",
	chip: { icon: QrCode, label: "Scan" },
	Art: () => (
		<div className="flex rotate-[3deg] flex-col items-center gap-2.5 rounded-[20px] border border-product-border bg-white px-[18px] pb-3.5 pt-[18px] shadow-product-hover">
			<div className="relative h-[132px] w-[132px] rounded-xl bg-white bg-[radial-gradient(var(--product-foreground)_40%,transparent_44%)] bg-[length:8px_8px] bg-[position:4px_4px]">
				{finders.map((pos) => (
					<i
						className={cn(
							"absolute h-9 w-9 rounded-[10px] border-[6px] border-[#6b3f22] bg-white shadow-[0_0_0_4px_#fff] after:absolute after:inset-[5px] after:rounded after:bg-product-primary after:content-['']",
							pos,
						)}
						key={pos}
					/>
				))}
				<span className="absolute left-1/2 top-1/2 grid h-[30px] w-[30px] -translate-x-1/2 -translate-y-1/2 place-items-center rounded-[9px] bg-[#6b3f22] font-[Georgia,serif] text-sm font-bold leading-none text-white shadow-[0_0_0_4px_#fff]">
					B
				</span>
			</div>
			<span className="font-product-heading text-[13px] font-extrabold leading-[1.2] text-product-foreground">
				Scan for our menu
			</span>
		</div>
	),
};
