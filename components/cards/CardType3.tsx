"use client";
import { memo, useMemo } from "react";
import { Record } from "@/types";

const CardType3 = memo(
	({
		record,
		currency,
		onClick,
	}: {
		record: Record;
		currency: string;
		onClick: () => void;
	}) => {
		const slugId = useMemo(
			() => record.name?.replace(/\s+/g, "-").toLowerCase() || "",
			[record.name],
		);
		return (
			<article
				aria-labelledby={`item-title-${slugId}`}
				className="bg-card-bg cursor-pointer rounded-[12px] p-2 sm:p-4 text-card-text flex flex-col sm:flex-row sm:flex-wrap border border-card-border shadow-[0_0_5px_1px_rgba(233,245,254,0.2)] gap-1.5 sm:gap-2 sm:items-center sm:justify-between"
				onClick={onClick}
				role="article"
				tabIndex={0}
			>
				<div className="flex flex-col flex-1 gap-0.5 sm:gap-1 min-w-0">
					<h3
						className="text-[16px] sm:text-[24px] font-heading tracking-heading text-card-heading leading-tight truncate"
						id={`item-title-${slugId}`}
					>
						{record.name}
					</h3>
					<p
						aria-describedby={`item-title-${slugId}`}
						className="text-[14px] sm:text-[16px] text-card-description font-body tracking-body leading-snug line-clamp-2 sm:line-clamp-1"
					>
						{record.description}
					</p>
				</div>

				<div className="pt-1 sm:pt-0 sm:pl-4 flex-shrink-0 text-right">
					<span
						aria-label={`Price: ${record.price} ${currency}`}
						className="text-[16px] sm:text-[22px] font-thin text-price block font-heading tracking-heading"
					>
						{record.price} {currency}
					</span>
				</div>
			</article>
		);
	},
);

export default CardType3;
