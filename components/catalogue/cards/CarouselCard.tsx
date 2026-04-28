"use client";
import { OptimizedImage } from "@/components/general/OptimizedImage";
import { CardProps } from "@/types/shared";
import BaseCard from "./common/BaseCard";
import CardDescription from "./common/CardDescription";
import CardTitle from "./common/CardTitle";
import PriceDisplay from "./common/PriceDisplay";

const CarouselCard = (props: CardProps) => {
	return (
		<BaseCard {...props} className="flex flex-col !h-full w-full flex-shrink-0">
			{(slugId) => (
				<>
					<div className="aspect-[4/3] w-full bg-transparent relative">
						<OptimizedImage
							alt={`Image of ${props.record.name}`}
							className="object-cover"
							src={props.record.image}
						/>
					</div>

					<div className="flex flex-col justify-start p-2 sm:p-3 gap-1 flex-grow">
						<div className="flex flex-col gap-1 flex-grow min-h-[60px]">
							<CardTitle
								className="text-[12px] sm:text-[14px] md:text-[18px] text-left"
								name={props.record.name}
								slugId={slugId}
							/>
							<CardDescription
								className="text-[10px] sm:text-[12px] md:text-[14px] text-left line-clamp-3 sm:line-clamp-4"
								description={props.record.description}
								slugId={slugId}
							/>
						</div>

						<PriceDisplay
							className="[&>span:last-child]:text-[12px] [&>span:last-child]:sm:text-[14px] [&>span:last-child]:md:text-[18px] text-left mt-auto items-start"
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

export default CarouselCard;
