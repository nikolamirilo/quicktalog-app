"use client";
import { useCard } from "@/hooks/useCard";
import { CardProps } from "@/types/components";
import CardControls from "./common/CardControls";
import CardDescription from "./common/CardDescription";
import CardTitle from "./common/CardTitle";
import DiscountBadge from "./common/DiscountBadge";
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
	blockIndex,
	itemIndex,
}: CardProps) => {
	const { slugId, rootProps } = useCard(record);

	return (
		<article
			className="bg-catalogue-card-background cursor-pointer p-2 sm:p-4 text-catalogue-card-text flex flex-col sm:flex-row sm:flex-wrap border border-catalogue-card-border gap-1.5 sm:gap-2 sm:items-center sm:justify-between relative group"
			onClick={onClick}
			style={{
				borderRadius: "var(--border-radius)",
				boxShadow: "var(--box-shadow)",
			}}
			{...rootProps}
		>
			{mode === "edit" && onEdit && onDelete && (
				<CardControls
					blockIndex={blockIndex}
					isFirst={isFirst}
					isLast={isLast}
					itemIndex={itemIndex}
					onDelete={onDelete}
					onEdit={onEdit}
					onMoveDown={onMoveDown}
					onMoveUp={onMoveUp}
				/>
			)}
			{record.discount?.isOnDiscount && record.discount?.discountPercentage && (
				<DiscountBadge
					discountPercentage={record.discount.discountPercentage}
					position="right"
					size="small"
				/>
			)}
			<div className="flex flex-col flex-1 gap-0.5 sm:gap-1 min-w-0">
				<CardTitle
					className="text-[16px] sm:text-[24px]"
					name={record.name}
					slugId={slugId}
				/>
				<CardDescription
					className="text-[14px] sm:text-[16px] line-clamp-2"
					description={record.description}
					slugId={slugId}
				/>
			</div>

			<div className="pt-1 sm:pt-0 sm:pl-2 flex-shrink-0 text-right">
				<PriceDisplay
					className="[&>span:last-child]:text-[16px] [&>span:last-child]:sm:text-[22px]"
					currency={currency}
					denominator={record.denominator}
					discount={record.discount}
					price={record.price}
				/>
			</div>
		</article>
	);
};

export default TextOnlyCard;
