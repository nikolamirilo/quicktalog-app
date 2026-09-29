import type { ReactNode } from "react";
import { cn } from "@/lib/ui/cn";
import LimitsOverlay from "@/components/catalogue/inputs/sidebar/LimitsOverlay";

interface LockedGroupProps {
	/** True when the plan doesn't include this group. */
	locked: boolean;
	children: ReactNode;
	overlaySize?: "sm" | "default" | "lg";
	overlayType?: "branding" | "other";
	className?: string;
}

/**
 * Shows a plan-locked group dimmed under the upgrade overlay. The fields stay
 * visible as a preview but are `inert`, so they can't be focused or changed
 * with the keyboard either.
 */
export const LockedGroup = ({
	locked,
	children,
	overlaySize = "sm",
	overlayType = "other",
	className,
}: LockedGroupProps) => (
	<div
		className={cn(
			"relative w-full",
			// Room for the overlay's lock, text and button over a short group.
			locked && overlaySize === "sm" && "min-h-[200px]",
			locked && overlaySize === "default" && "min-h-[240px]",
			className,
		)}
	>
		{locked && <LimitsOverlay size={overlaySize} type={overlayType} />}
		<div
			className={cn(locked && "pointer-events-none select-none opacity-30")}
			inert={locked || undefined}
		>
			{children}
		</div>
	</div>
);
