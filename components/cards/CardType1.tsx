"use client";
import { CategoryItem } from "@quicktalog/common";
import { memo, useMemo } from "react";
import { OptimizedImage } from "../common/OptimizedImage";

const CardType1 = memo(
	({
		record,
		currency,
		onClick,
	}: {
		record: CategoryItem;
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
				className="flex bg-card-bg cursor-pointer text-card-text rounded-[12px] border border-card-border shadow-lg overflow-hidden max-w-full min-h-[110px] sm:min-h-[150px]"
				onClick={onClick}
				role="article"
				tabIndex={0}
			>
				<div className="w-[40%] min-w-[90px] sm:min-w-[120px] aspect-[4/3] relative flex-shrink-0">
					<OptimizedImage
						alt={`Image of ${record.name}`}
						className="object-cover"
						src={record.image}
					/>
				</div>

				<div className="flex flex-col p-1.5 sm:p-3 flex-1 gap-1 sm:gap-2 min-w-0">
					<h3
						className="text-[13px] sm:text-[22px] font-heading tracking-heading text-card-heading leading-tight truncate"
						id={`item-title-${slugId}`}
					>
						{record.name}
					</h3>

					<p
						aria-describedby={`item-title-${slugId}`}
						className="text-[11px] sm:text-[16px] text-card-description font-body tracking-body leading-snug line-clamp-3 sm:line-clamp-4"
					>
						{record.description}
					</p>

					<div className="pt-0 sm:pt-1 mt-auto">
						<span
							aria-label={`Price: ${record.price} ${currency}`}
							className="text-[13px] sm:text-[20px] font-thin text-price font-heading tracking-heading"
						>
							{record.price} {currency}
						</span>
					</div>
				</div>
			</article>
		);
	},
);

export default CardType1;
