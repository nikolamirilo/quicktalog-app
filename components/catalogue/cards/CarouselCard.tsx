"use client";
import { OptimizedImage } from "@/components/general/OptimizedImage";
import { useCard } from "@/hooks/useCard";
import { CardProps } from "@/types/components";
import CardControls from "./common/CardControls";
import CardDescription from "./common/CardDescription";
import CardTitle from "./common/CardTitle";
import DiscountBadge from "./common/DiscountBadge";
import PriceDisplay from "./common/PriceDisplay";

const CarouselCard = ({
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
			className="flex flex-col cursor-pointer !h-full bg-catalogue-card-background text-catalogue-card-text border border-catalogue-card-border w-full flex-shrink-0 overflow-hidden relative group"
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
				/>
			)}
			<div className="aspect-[4/3] w-full bg-transparent relative">
				<OptimizedImage
					alt={`Image of ${record.name}`}
					className="object-cover"
					src={record.image}
				/>
			</div>

			<div className="flex flex-col justify-start p-2 sm:p-3 gap-1 flex-grow">
				<div className="flex flex-col gap-1 flex-grow min-h-[60px]">
					<CardTitle
						className="text-[12px] sm:text-[14px] md:text-[18px] text-left"
						name={record.name}
						slugId={slugId}
					/>
					<CardDescription
						className="text-[10px] sm:text-[12px] md:text-[14px] text-left line-clamp-3 sm:line-clamp-4"
						description={record.description}
						slugId={slugId}
					/>
				</div>

				<PriceDisplay
					className="[&>span:last-child]:text-[12px] [&>span:last-child]:sm:text-[14px] [&>span:last-child]:md:text-[18px] text-left mt-auto items-start"
					currency={currency}
					denominator={record.denominator}
					discount={record.discount}
					price={record.price}
				/>
			</div>
		</article>
	);
};

export default CarouselCard;
