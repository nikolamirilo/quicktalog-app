import { cn } from "@/lib/ui/cn";

/** Monospace version tag, e.g. "v2.0". */
export function VersionPill({
	version,
	size = "md",
	className,
}: {
	version: string;
	size?: "sm" | "md";
	className?: string;
}) {
	return (
		<span
			className={cn(
				"inline-flex items-center rounded-full bg-product-foreground font-mono font-bold leading-none text-white",
				size === "sm" ? "h-6 px-[9px] text-xs" : "h-7 px-[11px] text-[13px]",
				className,
			)}
		>
			{version}
		</span>
	);
}
