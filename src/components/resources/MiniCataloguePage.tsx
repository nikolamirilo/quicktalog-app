import { cn } from "@/lib/ui/cn";

const rows = [
	{
		name: "Flat white",
		note: "Double shot, silky milk",
		price: "$3.80",
		thumb: "bg-[linear-gradient(135deg,#e9c9a3,#b98256)]",
	},
	{
		name: "Cortado",
		note: "Equal parts espresso and milk",
		price: "$3.40",
		thumb: "bg-[linear-gradient(135deg,#f3ddb9,#c8955e)]",
	},
	{
		name: "Cold brew",
		note: "Steeped for 18 hours",
		price: "$4.20",
		thumb: "bg-[linear-gradient(135deg,#d9b38c,#8c5a35)]",
	},
];

/**
 * Decorative sample catalogue ("Bean There Café") used in article covers and
 * the featured docs card. Always rendered inside an `aria-hidden` wrapper.
 */
export function MiniCataloguePage({
	showCta = true,
	className,
}: {
	showCta?: boolean;
	className?: string;
}) {
	return (
		<div
			className={cn(
				"min-w-0 rounded-xl bg-[#fbf6ee] p-2.5 text-left text-[12px] leading-[1.35]",
				className,
			)}
		>
			<div className="flex items-center gap-[7px] border-b border-[#eadcc8] pb-2">
				<span className="grid h-[22px] w-[22px] flex-none place-items-center rounded-full bg-[#6b3f22] font-[Georgia,serif] text-[11px] font-bold leading-none text-[#fbf6ee]">
					B
				</span>
				<b className="min-w-0 flex-1 truncate font-[Georgia,serif] text-[12.5px] text-[#3b2415]">
					Bean There Café
				</b>
				{showCta && (
					<span className="flex-none whitespace-nowrap rounded-full bg-[#6b3f22] px-2 py-1 text-[10px] font-bold text-white">
						Order ahead
					</span>
				)}
			</div>
			<p className="mt-2 font-[Georgia,serif] text-[15px] font-bold leading-[1.2] text-[#3b2415]">
				Our menu
			</p>
			<div className="mt-1.5 flex gap-1 overflow-hidden">
				{["Coffee", "Pastries", "Brunch"].map((chip, i) => (
					<span
						className={cn(
							"whitespace-nowrap rounded-full border px-2 py-[3px] text-[10px] font-semibold",
							i === 0
								? "border-[#3b2415] bg-[#3b2415] text-white"
								: "border-[#eadcc8] bg-white text-[#6b5443]",
						)}
						key={chip}
					>
						{chip}
					</span>
				))}
			</div>
			<p className="mt-[9px] text-[11px] font-bold uppercase leading-none tracking-[0.08em] text-[#8a6a52]">
				Coffee
			</p>
			{rows.map((row) => (
				<div
					className="mt-1.5 flex items-center gap-2 rounded-[9px] border border-[#f0e4d3] bg-white p-1.5"
					key={row.name}
				>
					<span className={cn("h-7 w-7 flex-none rounded-[7px]", row.thumb)} />
					<span className="flex min-w-0 flex-1 flex-col">
						<b className="truncate text-[11.5px] text-[#3b2415]">{row.name}</b>
						<small className="truncate text-[10px] text-[#8a7564]">
							{row.note}
						</small>
					</span>
					<em className="text-[11.5px] font-extrabold not-italic text-[#3b2415]">
						{row.price}
					</em>
				</div>
			))}
		</div>
	);
}
