"use client";
import { useCard } from "@/hooks/useCard";
import { CardProps } from "@/types/shared";
import CardControls from "./CardControls";
import DiscountBadge from "./DiscountBadge";

export interface BaseCardProps extends CardProps {
	className: string;
	children: (slugId: string) => React.ReactNode;
	discountPosition?: "left" | "right";
	discountSize?: "normal" | "small";
}

const BaseCard = ({
	record,
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
	className,
	children,
	discountPosition = "left",
	discountSize = "normal",
}: BaseCardProps) => {
	const { slugId, rootProps } = useCard(record);

	return (
		<article
			className={`card-catalogue cursor-pointer bg-catalogue-card-background text-catalogue-card-text border border-catalogue-card-border overflow-hidden relative group ${className}`}
			onClick={onClick}
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
					position={discountPosition}
					size={discountSize}
				/>
			)}
			{children(slugId)}
		</article>
	);
};

export default BaseCard;
