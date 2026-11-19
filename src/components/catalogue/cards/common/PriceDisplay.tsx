import { cn } from "@/lib/ui/cn";
import { Item } from "@quicktalog/common";
import { SalePill } from "./SalePill";

interface PriceDisplayProps {
	price: string | number;
	currency: string;
	discount?: Item["discount"];
	denominator?: string;
	className?: string;
	layout?: "vertical" | "horizontal";
	/** Set only on cards with no photo to put the pill on; the rest overlay it. */
	percentOff?: number;
}

const PriceDisplay = ({
	price,
	currency,
	discount,
	denominator,
	className,
	layout = "vertical",
	percentOff,
}: PriceDisplayProps) => {
	const isOnDiscount = discount?.isOnDiscount;
	const finalPrice = isOnDiscount ? discount.discountedPrice : price;
	const delimiterText = denominator ? ` / ${denominator}` : "";
	const salePill =
		isOnDiscount && percentOff ? (
			<SalePill percentOff={percentOff} size="small" />
		) : null;

	// An item with no price renders no price row at all.
	if (finalPrice === "" || finalPrice === undefined || finalPrice === null) {
		return null;
	}

	if (layout === "horizontal" && isOnDiscount) {
		return (
			<div className={cn("flex items-center gap-2", className)}>
				<span className="text-[13px] sm:text-[16px] line-through text-gray-400 font-body">
					{price} {currency}
				</span>
				{salePill}
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
				<span className="flex items-center gap-1.5">
					<span className="text-[13px] sm:text-[16px] line-through text-gray-400 font-body">
						{price} {currency}
					</span>
					{salePill}
				</span>
			)}
			<span
				aria-label={`Price: ${finalPrice} ${currency}${delimiterText}`}
				className={cn(
					"font-heading tracking-heading",
					isOnDiscount ? "text-price font-bold" : "font-semibold text-price",
				)}
			>
				{finalPrice} {currency}
				{delimiterText}
			</span>
		</div>
	);
};

export default PriceDisplay;
