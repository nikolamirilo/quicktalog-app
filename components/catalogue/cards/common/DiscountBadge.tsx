interface DiscountBadgeProps {
	discountPercentage: number;
	position?: "left" | "right";
	size?: "normal" | "small";
}

const DiscountBadge = ({
	discountPercentage,
	position = "left",
	size = "normal",
}: DiscountBadgeProps) => {
	const isLeft = position === "left";
	const isSmall = size === "small";

	const dimensions = isSmall ? "w-[60px] h-[60px]" : "w-[80px] h-[80px]";
	const textSize = isSmall ? "text-[10px] sm:text-xs" : "text-xs sm:text-sm";
	const textPosition = isSmall
		? isLeft
			? "top-1.5 left-2"
			: "top-1.5 right-2"
		: isLeft
			? "top-2 left-3"
			: "top-2 right-3";

	return (
		<div
			className={`absolute top-0 ${isLeft ? "left-0" : "right-0"} ${dimensions} z-10 overflow-hidden pointer-events-none`}
			style={{
				clipPath: isLeft
					? "polygon(0 0, 100% 0, 0 100%)"
					: "polygon(0 0, 100% 0, 100% 100%)",
				backgroundColor: "#ef4444",
				...(isLeft
					? { borderTopLeftRadius: "var(--border-radius)" }
					: { borderTopRightRadius: "var(--border-radius)" }),
			}}
		>
			<span
				className={`absolute ${textPosition} !text-white font-bold ${textSize} whitespace-nowrap`}
			>
				{discountPercentage}%
			</span>
		</div>
	);
};

export default DiscountBadge;
