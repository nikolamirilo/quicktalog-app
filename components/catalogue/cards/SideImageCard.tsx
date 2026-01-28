"use client";
import { OptimizedImage } from "@/components/general/OptimizedImage";
import { useCard } from "@/hooks/useCard";
import { CardProps } from "@/types/components";
import CardControls from "./common/CardControls";
import CardDescription from "./common/CardDescription";
import CardTitle from "./common/CardTitle";
import PriceDisplay from "./common/PriceDisplay";

const SideImageCard = ({
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
			className="flex bg-card-bg cursor-pointer text-card-text border border-card-border overflow-hidden max-w-full min-h-[110px] sm:min-h-[150px] relative group"
			onClick={onClick}
			style={{
				borderRadius: "var(--border-radius)",
				boxShadow: "var(--box-shadow)",
			}}
			{...rootProps}
		>
			{mode === "edit" && onEdit && onDelete && (
				<CardControls
					isFirst={isFirst}
					isLast={isLast}
					onDelete={onDelete}
					onEdit={onEdit}
					onMoveDown={onMoveDown}
					onMoveUp={onMoveUp}
				/>
			)}
			<div className="w-[40%] min-w-[90px] sm:min-w-[120px] aspect-[4/3] relative flex-shrink-0">
				<OptimizedImage
					alt={`Image of ${record.name}`}
					className="object-cover"
					src={record.image}
				/>
			</div>

			<div className="flex flex-col p-1.5 sm:p-3 flex-1 gap-1 sm:gap-2 min-w-0">
				<CardTitle
					className="text-[13px] sm:text-[22px]"
					name={record.name}
					slugId={slugId}
				/>

				<CardDescription
					className="text-[11px] sm:text-[16px] line-clamp-3 sm:line-clamp-4"
					description={record.description}
					slugId={slugId}
				/>

				<div className="pt-0 sm:pt-1 mt-auto">
					<PriceDisplay
						className="[&>span:last-child]:text-[13px] [&>span:last-child]:sm:text-[20px] items-start"
						currency={currency}
						denominator={record.denominator}
						discount={record.discount}
						price={record.price}
					/>
				</div>
			</div>
		</article>
	);
};

export default SideImageCard;
