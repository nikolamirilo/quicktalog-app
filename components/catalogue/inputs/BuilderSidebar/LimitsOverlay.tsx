import { Button } from "@/components/ui/button";
import { Lock } from "lucide-react";
import Link from "next/link";

const LimitsOverlay = ({
	size = "default",
}: {
	size?: "sm" | "default" | "lg";
}) => {
	const paragraphSize =
		size === "sm" ? "text-sm" : size === "default" ? "text-base" : "text-lg";
	const headingSize =
		size === "sm" ? "text-base" : size === "default" ? "text-lg" : "text-xl";
	const lockSize =
		size === "sm" ? "w-8 h-8" : size === "default" ? "w-10 h-10" : "w-12 h-12";
	const gapSize =
		size === "sm" ? "gap-2" : size === "default" ? "gap-3" : "gap-4";
	return (
		<div
			className={`absolute inset-0 z-10 flex flex-col items-center justify-center bg-white/40 backdrop-blur-[2px] rounded-lg p-6 ${gapSize}`}
		>
			<Lock className={`${lockSize} text-muted-foreground`} />
			<h3 className={`font-bold text-center text-foreground ${headingSize}`}>
				Upgrade Required
			</h3>
			<p
				className={`text-muted-foreground text-center max-w-[250px] ${paragraphSize}`}
			>
				Upgrade your plan to unlock this feature.
			</p>
			<Link href={`/pricing`}>
				<Button size={size}>Upgrade Now</Button>
			</Link>
		</div>
	);
};

export default LimitsOverlay;
