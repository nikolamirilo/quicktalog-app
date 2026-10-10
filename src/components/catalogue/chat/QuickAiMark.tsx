import { cn } from "@/lib/ui/cn";

/** The Quick AI mark: a "Q" whose tail is an AI sparkle. Follows `currentColor` like a lucide icon. */
export function QuickAiMark({ className }: { className?: string }) {
	return (
		<svg
			aria-hidden="true"
			className={cn("size-6 flex-none", className)}
			fill="none"
			viewBox="0 0 24 24"
		>
			<circle
				cx="10.5"
				cy="10.5"
				r="6.75"
				stroke="currentColor"
				strokeWidth="2.5"
			/>
			<path
				d="M18 13.5c.35 2.45 1.6 3.7 4.05 4.05-2.45.35-3.7 1.6-4.05 4.05-.35-2.45-1.6-3.7-4.05-4.05 2.45-.35 3.7-1.6 4.05-4.05Z"
				fill="currentColor"
			/>
			<circle cx="19.25" cy="3.75" fill="currentColor" r="1.25" />
		</svg>
	);
}
