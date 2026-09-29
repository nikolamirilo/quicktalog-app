import { CircleAlert, CircleCheck } from "lucide-react";

import { cn } from "@/lib/ui/cn";

/**
 * Live availability line under a catalogue-name field (`.as-hint`): green when
 * the name is free, red with the reason when it is not. Announced politely.
 */
export function NameHint({
	id,
	show,
	error,
	checking = false,
}: {
	id: string;
	show: boolean;
	error?: string;
	checking?: boolean;
}) {
	const tone = error ? "err" : checking ? "idle" : "ok";
	return (
		<p
			aria-live="polite"
			className={cn(
				"flex min-h-[1em] items-start gap-1.5 text-[12.5px] leading-snug [&_svg]:mt-px [&_svg]:size-3.5 [&_svg]:flex-none",
				tone === "err" && "text-product-error",
				tone === "ok" && "text-product-success",
				tone === "idle" && "text-product-muted",
			)}
			id={id}
		>
			{show &&
				(error ? (
					<>
						<CircleAlert aria-hidden="true" />
						{error}
					</>
				) : checking ? (
					"Checking availability…"
				) : (
					<>
						<CircleCheck aria-hidden="true" />
						Great! This name is available.
					</>
				))}
		</p>
	);
}
