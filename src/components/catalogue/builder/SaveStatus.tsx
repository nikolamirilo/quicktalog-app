"use client";
import { Check, CloudOff, Loader2 } from "lucide-react";
import { useBuilderStatus } from "@/context/BuilderStatusContext";
import { cn } from "@/lib/ui/cn";

type Variant = "rail" | "bar";

/** What the owner is told, now that there is no Save button to press. */
function label(state: string, unpublished: boolean) {
	switch (state) {
		case "saving":
		case "pending":
			return "Saving…";
		case "retrying":
			return "Offline – retrying";
		case "conflict":
			return "Changed elsewhere";
		default:
			return unpublished ? "Saved, not published" : "All changes saved";
	}
}

function Icon({ state }: { state: string }) {
	if (state === "saving" || state === "pending") {
		return <Loader2 aria-hidden="true" className="animate-spin" />;
	}
	if (state === "retrying" || state === "conflict") {
		return <CloudOff aria-hidden="true" />;
	}
	return <Check aria-hidden="true" />;
}

/**
 * The builder's save status, and the way into the kept autosaves. It replaces the Save
 * button in the rail and in the phone bar, so the owner always has an answer to "has my
 * work been stored?" without having to press anything.
 */
export function SaveStatus({
	variant,
	onOpenHistory,
}: {
	variant: Variant;
	onOpenHistory: () => void;
}) {
	const status = useBuilderStatus();
	if (!status) return null;

	const text = label(status.state, status.unpublished);
	const warning = status.state === "retrying" || status.state === "conflict";

	if (variant === "bar") {
		return (
			<button
				aria-label={`${text}. Open version history`}
				className="flex min-h-[52px] min-w-0 flex-1 flex-col items-center justify-end gap-1 rounded-xl px-1 pb-2.5 text-product-foreground-accent transition-colors duration-200 active:bg-product-background-hero [-webkit-tap-highlight-color:transparent]"
				onClick={onOpenHistory}
				type="button"
			>
				<span
					className={cn(
						"[&_svg]:size-5",
						warning ? "text-product-error" : "text-product-foreground-accent",
					)}
				>
					<Icon state={status.state} />
				</span>
				<span className="max-w-full truncate text-[11px] font-semibold">
					{warning ? "Retrying" : "Saved"}
				</span>
			</button>
		);
	}

	return (
		<button
			className={cn(
				"flex h-auto min-h-[52px] w-full flex-col items-center justify-center gap-1 rounded-2xl px-0.5 py-2 text-center text-[11px] font-semibold leading-tight transition-colors hover:bg-product-background-hero",
				warning ? "text-product-error" : "text-product-muted",
			)}
			onClick={onOpenHistory}
			title="Open version history"
			type="button"
		>
			<span className="[&_svg]:size-[18px]">
				<Icon state={status.state} />
			</span>
			<span className="max-w-full">{text}</span>
			<span className="sr-only">Open version history</span>
		</button>
	);
}
