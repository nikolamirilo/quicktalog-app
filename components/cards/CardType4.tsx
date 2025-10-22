"use client";
import { memo, useMemo } from "react";
import { Record } from "@/types";
import { OptimizedImage } from "../common/OptimizedImage";

const CardType4 = memo(
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
				className="flex flex-col cursor-pointer !h-full bg-card-bg text-card-text rounded-[16px] border border-card-border shadow-[0_0_5px_1px_rgba(233,245,254,0.2)] w-full sm:w-[220px] md:w-[260px] lg:w-[320px] flex-shrink-0 overflow-hidden"
				onClick={onClick}
				role="article"
				tabIndex={0}
			>
				<div className="w-full aspect-[4/3] max-h-[120px] sm:max-h-[140px] md:max-h-[180px] bg-gray-100 relative">
					<OptimizedImage
						alt={`Image of ${record.name}`}
						className="object-cover"
						src={record.image}
					/>
				</div>

				<div className="flex flex-col justify-start p-2 sm:p-3 gap-1 flex-grow">
					<div className="flex flex-col gap-1 flex-grow min-h-[60px]">
						<h5
							className="text-[12px] sm:text-[14px] md:text-[18px] font-heading tracking-heading text-card-heading text-left truncate"
							id={`item-title-${slugId}`}
						>
							{record.name}
						</h5>
						<p
							aria-describedby={`item-title-${slugId}`}
							className="text-[10px] sm:text-[12px] md:text-[14px] text-card-description font-body tracking-body text-left leading-snug line-clamp-3 sm:line-clamp-4"
						>
							{record.description}
						</p>
					</div>

					<span
						aria-label={`Price: ${record.price} ${currency}`}
						className="text-[12px] sm:text-[14px] md:text-[18px] font-thin text-price text-left mt-auto font-heading tracking-heading flex-shrink-0"
					>
						{record.price} {currency}
					</span>
				</div>
			</article>
		);
	},
);

export default CardType4;
