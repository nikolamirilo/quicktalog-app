"use client";
import { CardProps } from "@/types/shared";
import BaseCard from "./common/BaseCard";
import CardDescription from "./common/CardDescription";
import CardTitle from "./common/CardTitle";
import PriceDisplay from "./common/PriceDisplay";

const TextOnlyCard = (props: CardProps) => {
	return (
		<BaseCard
			{...props}
			className="p-2 sm:p-4 flex flex-col sm:flex-row sm:flex-wrap gap-1.5 sm:gap-2 sm:items-center sm:justify-between"
			discountPosition="right"
			discountSize="small"
		>
			{(slugId) => (
				<>
					<div className="flex flex-col flex-1 gap-0.5 sm:gap-1 min-w-0">
						<CardTitle
							className="text-[16px] sm:text-[24px]"
							name={props.record.name}
							slugId={slugId}
						/>
						<CardDescription
							className="text-[14px] sm:text-[16px] line-clamp-2"
							description={props.record.description}
							slugId={slugId}
						/>
					</div>

					<div className="pt-1 sm:pt-0 sm:pl-2 flex-shrink-0 text-right">
						<PriceDisplay
							className="[&>span:last-child]:text-[16px] [&>span:last-child]:sm:text-[22px]"
							currency={props.currency}
							denominator={props.record.denominator}
							discount={props.record.discount}
							price={props.record.price}
						/>
					</div>
				</>
			)}
		</BaseCard>
	);
};

export default TextOnlyCard;
