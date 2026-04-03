import { Star } from "lucide-react";
import Link from "next/link";
import { Button } from "../ui/button";

const UpgradePlanCTA = ({
	type = "default",
	size = "default",
	title,
	subtitle,
	href,
	ctaLabel,
}: {
	type?: "default" | "form";
	size?: "default" | "small";
	title: string;
	subtitle: string;
	href?: string;
	ctaLabel?: string;
}) => {
	const isSmall = size === "small";

	return (
		<div
			className={`flex flex-col sm:flex-row items-center mb-6 justify-between gap-4 bg-gradient-to-r from-product-primary/10 to-product-primary/5 border-2 border-product-primary rounded-2xl shadow-lg ${isSmall ? "p-4" : "p-6"
				}`}
		>
			<div className="text-center sm:text-left">
				<h2
					className={`${isSmall ? "text-lg" : "text-xl"
						} font-bold text-product-foreground flex items-center gap-2`}
				>
					<Star
						className={`${isSmall ? "w-4 h-4" : "w-5 h-5"} text-product-primary`}
					/>
					{title}
				</h2>
				<p
					className={`text-product-foreground-accent ${isSmall ? "text-xs" : "text-sm"
						} mt-1`}
				>
					{subtitle}
				</p>
			</div>
			{type === "default" && (
				<Link href={href}>
					<Button
						className={`w-fit ${isSmall ? "min-w-32" : "min-w-56"
							} bg-product-primary  shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105`}
						size={isSmall ? "sm" : "default"}
						variant="default"
					>
						<Star className="w-4 h-4" />
						{ctaLabel}
					</Button>
				</Link>
			)}
		</div>
	);
};

export default UpgradePlanCTA;
