import { cn } from "@/helpers/client";
import { Item } from "@quicktalog/common";

interface PriceDisplayProps {
	price: string | number;
	currency: string;
	discount?: Item["discount"];
	denominator?: string;
	className?: string;
	layout?: "vertical" | "horizontal";
}

const PriceDisplay = ({
	price,
	currency,
	discount,
	denominator,
	className,
	layout = "vertical",
}: PriceDisplayProps) => {
	const isOnDiscount = discount?.isOnDiscount;
	const finalPrice = isOnDiscount ? discount.discountedPrice : price;
	const delimiterText = denominator ? ` / ${denominator}` : "";

	if (layout === "horizontal" && isOnDiscount) {
		return (
			<div className={cn("flex items-center gap-2", className)}>
				<span className="text-[13px] sm:text-[16px] line-through text-gray-400 font-body">
					{price} {currency}
				</span>
				<span
					aria-label={`Price: ${finalPrice} ${currency}${delimiterText}`}
					className="font-bold text-price font-heading tracking-heading"
				>
					{finalPrice} {currency}
					{delimiterText}
				</span>
			</div>
		);
	}

	return (
		<div className={cn("flex flex-col items-end", className)}>
			{isOnDiscount && (
				<span className="text-[13px] sm:text-[16px] line-through text-gray-400 font-body">
					{price} {currency}
				</span>
			)}
			<span
				aria-label={`Price: ${finalPrice} ${currency}${delimiterText}`}
				className={cn(
					"font-heading tracking-heading",
					isOnDiscount ? "text-price font-bold" : "font-thin text-price",
				)}
			>
				{finalPrice} {currency}
				{delimiterText}
			</span>
		</div>
	);
};

export default PriceDisplay;
