import { cn } from "@/helpers/client";
import { Item } from "@quicktalog/common";

interface PriceDisplayProps {
	price: string | number;
	currency: string;
	discount?: Item["discount"];
	denominator?: string;
	className?: string;
}

const PriceDisplay = ({
	price,
	currency,
	discount,
	denominator,
	className,
}: PriceDisplayProps) => {
	const isOnDiscount = discount?.isOnDiscount;
	const finalPrice = isOnDiscount ? discount.discountedPrice : price;
	const delimiterText = denominator ? ` / ${denominator}` : "";

	return (
		<div className={cn("flex flex-col items-end", className)}>
			{isOnDiscount && (
				<span className="text-[10px] sm:text-[12px] line-through text-gray-400 font-body">
					{price} {currency}
				</span>
			)}
			<span
				aria-label={`Price: ${finalPrice} ${currency}${delimiterText}`}
				className={cn(
					"font-thin text-price font-heading tracking-heading",
					isOnDiscount ? "text-red-500 font-normal" : "text-price",
				)}
			>
				{finalPrice} {currency}
				{delimiterText}
			</span>
		</div>
	);
};

export default PriceDisplay;
