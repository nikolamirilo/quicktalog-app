"use client";
import { OptimizedImage } from "@/components/general/OptimizedImage";
import { useCard } from "@/hooks/useCard";
import { CardProps } from "@/types/components";
import CardControls from "./common/CardControls";
import CardDescription from "./common/CardDescription";
import CardTitle from "./common/CardTitle";
import PriceDisplay from "./common/PriceDisplay";

const TopImageCard = ({
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
			className="flex cursor-pointer flex-col bg-card-bg text-card-text rounded-[12px] border border-card-border shadow-[0_0_5px_1px_rgba(233,245,254,0.2)] overflow-hidden w-[45%] max-w-[180px] sm:max-w-[220px] md:max-w-[260px] relative group"
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
			<div className="aspect-[4/3] bg-gray-100 relative w-full">
				<OptimizedImage
					alt={`Image of ${record.name}`}
					className="object-cover"
					src={record.image}
				/>
			</div>

			<div className="flex flex-col justify-between flex-1 p-2 sm:p-3 md:p-4 gap-1.5 sm:gap-2">
				<div className="flex-1 min-h-0">
					<CardTitle
						name={record.name}
						slugId={slugId}
						className="text-[14px] sm:text-[18px] md:text-[22px]"
					/>
					<CardDescription
						description={record.description}
						slugId={slugId}
						className="text-[12px] sm:text-[15px] md:text-[16px] line-clamp-2 sm:line-clamp-3"
					/>
				</div>

				<div className="flex-shrink-0">
					<PriceDisplay
						price={record.price}
						currency={currency}
						discount={record.discount}
						denominator={record.denominator}
						className="[&>span:last-child]:text-[14px] [&>span:last-child]:sm:text-[18px] [&>span:last-child]:md:text-[22px] items-start"
					/>
				</div>
			</div>
		</article>
	);
};

export default TopImageCard;
