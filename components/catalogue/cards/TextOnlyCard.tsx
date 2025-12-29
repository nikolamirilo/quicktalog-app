"use client";
import React from "react";
import { useCard } from "@/hooks/useCard";
import { CardProps } from "@/types/components";
import CardControls from "./common/CardControls";
import CardTitle from "./common/CardTitle";
import CardDescription from "./common/CardDescription";
import PriceDisplay from "./common/PriceDisplay";

const TextOnlyCard = ({
	record,
	currency,
	onClick,
	mode,
	onEdit,
	onDelete,
	onMoveUp,
	onMoveDown,
	isFirst,
	isLast,
}: CardProps) => {
	const { slugId, rootProps } = useCard(record);

	return (
		<article
			className="bg-card-bg cursor-pointer rounded-[12px] p-2 sm:p-4 text-card-text flex flex-col sm:flex-row sm:flex-wrap border border-card-border shadow-[0_0_5px_1px_rgba(233,245,254,0.2)] gap-1.5 sm:gap-2 sm:items-center sm:justify-between relative group"
			onClick={onClick}
			{...rootProps}
		>
			{mode === "edit" && onEdit && onDelete && (
				<CardControls
					onDelete={onDelete}
					onEdit={onEdit}
					onMoveUp={onMoveUp}
					onMoveDown={onMoveDown}
					isFirst={isFirst}
					isLast={isLast}
				/>
			)}
			<div className="flex flex-col flex-1 gap-0.5 sm:gap-1 min-w-0">
				<CardTitle
					name={record.name}
					slugId={slugId}
					className="text-[16px] sm:text-[24px]"
				/>
				<CardDescription
					description={record.description}
					slugId={slugId}
					className="text-[14px] sm:text-[16px] line-clamp-2"
				/>
			</div>

			<div className="pt-1 sm:pt-0 sm:pl-4 flex-shrink-0 text-right">
				<PriceDisplay
					price={record.price}
					currency={currency}
					discount={record.discount}
					denominator={record.denominator}
					className="[&>span:last-child]:text-[16px] [&>span:last-child]:sm:text-[22px]"
				/>
			</div>
		</article>
	);
};

export default TextOnlyCard;
