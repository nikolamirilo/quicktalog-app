"use client";
import { useCard } from "@/hooks/useCard";
import { CardProps } from "@/types/shared";
import CardControls from "./CardControls";
import { SalePill } from "./SalePill";

interface BaseCardProps extends CardProps {
	className: string;
	children: (slugId: string) => React.ReactNode;
	/** A card with no photo shows the pill in its price row instead. */
	showSalePill?: boolean;
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
	blockId,
	className,
	children,
	percentOff,
	showSalePill = true,
}: BaseCardProps) => {
	const { slugId, rootProps } = useCard(record);

	return (
		<article
			className={`card-catalogue cursor-pointer bg-catalogue-card-background text-catalogue-card-text border border-catalogue-card-border overflow-hidden relative group ${className}`}
			// AI review highlights find a changed item by this.
			data-item-id={record?.id}
			onClick={onClick}
			{...rootProps}
		>
			{mode === "edit" && onEdit && onDelete && (
				<CardControls
					blockId={blockId}
					isFirst={isFirst}
					isLast={isLast}
					itemId={record?.id}
					onDelete={onDelete}
					onEdit={onEdit}
					onMoveDown={onMoveDown}
					onMoveUp={onMoveUp}
				/>
			)}
			{showSalePill && percentOff ? (
				<SalePill
					className="pointer-events-none absolute left-2 top-2 z-10 shadow-[0_1px_6px_rgba(0,0,0,0.28)]"
					percentOff={percentOff}
				/>
			) : null}
			{children(slugId)}
		</article>
	);
};

export default BaseCard;
