"use client";
import { OptimizedImage } from "@/components/general/OptimizedImage";
import { CardProps } from "@/types/shared";
import BaseCard from "./common/BaseCard";
import CardDescription from "./common/CardDescription";
import CardTitle from "./common/CardTitle";
import PriceDisplay from "./common/PriceDisplay";

const SideImageCard = (props: CardProps) => {
	return (
		<BaseCard
			{...props}
			className="flex max-w-full min-h-[110px] sm:min-h-[150px]"
		>
			{(slugId) => (
				<>
					<div className="w-[40%] min-w-[90px] sm:min-w-[120px] aspect-[4/3] relative flex-shrink-0">
						<OptimizedImage
							alt={`Image of ${props.record.name}`}
							className="object-cover"
							src={props.record.image}
						/>
					</div>

					<div className="flex flex-col p-1.5 sm:p-3 flex-1 gap-1 sm:gap-2 min-w-0">
						<CardTitle
							className="text-[13px] sm:text-[22px]"
							name={props.record.name}
							slugId={slugId}
						/>

						<CardDescription
							className="text-[11px] sm:text-[16px] line-clamp-3 sm:line-clamp-4"
							description={props.record.description}
							slugId={slugId}
						/>

						<div className="pt-0 sm:pt-1 mt-auto">
							<PriceDisplay
								className="[&>span:last-child]:text-[13px] [&>span:last-child]:sm:text-[20px] items-start"
								currency={props.currency}
								denominator={props.record.denominator}
								discount={props.record.discount}
								layout="horizontal"
								price={props.record.price}
							/>
						</div>
					</div>
				</>
			)}
		</BaseCard>
	);
};

export default SideImageCard;
