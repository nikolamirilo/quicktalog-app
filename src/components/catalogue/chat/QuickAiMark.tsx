import { useId } from "react";

import { cn } from "@/lib/ui/cn";

/**
 * The Quick AI mark: a "Q" whose tail is an AI sparkle. `gradient` is the brand
 * version for dark tiles; `line` follows `currentColor` like a lucide icon.
 */
export function QuickAiMark({
	variant = "line",
	className,
}: {
	variant?: "gradient" | "line";
	className?: string;
}) {
	const gradientId = useId();
	const paint = variant === "gradient" ? `url(#${gradientId})` : "currentColor";

	return (
		<svg
			aria-hidden="true"
			className={cn("size-6 flex-none", className)}
			fill="none"
			viewBox="0 0 24 24"
		>
			{variant === "gradient" && (
				<defs>
					<linearGradient id={gradientId} x1="3" x2="22" y1="3" y2="22">
						<stop offset="0" stopColor="#ffd27a" />
						<stop offset="0.55" stopColor="#ffb020" />
						<stop offset="1" stopColor="#f5a300" />
					</linearGradient>
				</defs>
			)}
			<circle cx="10.5" cy="10.5" r="6.75" stroke={paint} strokeWidth="2.5" />
			<path
				d="M18 13.5c.35 2.45 1.6 3.7 4.05 4.05-2.45.35-3.7 1.6-4.05 4.05-.35-2.45-1.6-3.7-4.05-4.05 2.45-.35 3.7-1.6 4.05-4.05Z"
				fill={paint}
			/>
			<circle cx="19.25" cy="3.75" fill={paint} r="1.25" />
		</svg>
	);
}
