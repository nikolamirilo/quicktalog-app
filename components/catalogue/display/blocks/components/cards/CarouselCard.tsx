"use client";
import { OptimizedImage } from "@/components/common/OptimizedImage";
import { useCard } from "@/hooks/useCard";
import { CardProps } from "@/types/components";
import CardControls from "./common/CardControls";
import CardDescription from "./common/CardDescription";
import CardTitle from "./common/CardTitle";
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
}: CardProps) => {
	const { slugId, rootProps } = useCard(record);

	return (
		<article
			className="flex flex-col cursor-pointer !h-full bg-card-bg text-card-text rounded-[16px] border border-card-border shadow-[0_0_5px_1px_rgba(233,245,254,0.2)] w-full flex-shrink-0 overflow-hidden relative group"
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
						name={record.name}
						slugId={slugId}
						className="text-[12px] sm:text-[14px] md:text-[18px] text-left"
					/>
					<CardDescription
						description={record.description}
						slugId={slugId}
						className="text-[10px] sm:text-[12px] md:text-[14px] text-left line-clamp-3 sm:line-clamp-4"
					/>
				</div>

				<PriceDisplay
					price={record.price}
					currency={currency}
					discount={record.discount}
					denominator={record.denominator}
					className="[&>span:last-child]:text-[12px] [&>span:last-child]:sm:text-[14px] [&>span:last-child]:md:text-[18px] text-left mt-auto items-start"
				/>
			</div>
		</article>
	);
};

export default CarouselCard;
