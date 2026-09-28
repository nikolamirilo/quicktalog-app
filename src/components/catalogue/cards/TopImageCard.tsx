"use client";
import { OptimizedImage } from "@/components/general/OptimizedImage";
import { CardProps } from "@/types/shared";
import BaseCard from "./common/BaseCard";
import CardDescription from "./common/CardDescription";
import CardTitle from "./common/CardTitle";
import PriceDisplay from "./common/PriceDisplay";

const TopImageCard = (props: CardProps) => {
	return (
		<BaseCard
			{...props}
			className="flex flex-col w-[45%] max-w-[180px] sm:max-w-[220px] md:max-w-[260px]"
		>
			{(slugId) => (
				<>
					<div className="aspect-[4/3] bg-gray-100 relative w-full">
						<OptimizedImage
							alt={`Image of ${props.record.name}`}
							className="object-cover"
							src={props.record.image}
						/>
					</div>

					<div className="flex flex-col justify-between flex-1 p-2 sm:p-3 md:p-4 gap-1.5 sm:gap-2">
						<div className="flex-1 min-h-0">
							<CardTitle
								className="text-[14px] sm:text-[18px] md:text-[22px]"
								name={props.record.name}
								slugId={slugId}
							/>
							<CardDescription
								className="text-[12px] sm:text-[15px] md:text-[16px] line-clamp-2 sm:line-clamp-3"
								description={props.record.description}
								slugId={slugId}
							/>
						</div>

						<div className="flex-shrink-0">
							<PriceDisplay
								className="[&>span:last-child]:text-[14px] [&>span:last-child]:sm:text-[18px] [&>span:last-child]:md:text-[22px] items-start"
								currency={props.currency}
								denominator={props.record.denominator}
								discount={props.record.discount}
								price={props.record.price}
							/>
						</div>
					</div>
				</>
			)}
		</BaseCard>
	);
};

export default TopImageCard;
