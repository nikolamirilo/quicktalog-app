"use client";

import { Check, ChevronDown, Sparkles, Undo2 } from "lucide-react";
import { useId, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/ui/cn";

interface AiReviewBarProps {
	/** One line per edit the AI made, in order. */
	changes: string[];
	/** The AI is still working: deciding now would race its next edit. */
	busy: boolean;
	onAccept: () => void;
	onReject: () => void;
	/** `panel` sits above the chat composer; `floating` stands in while the chat is minimised. */
	variant: "panel" | "floating";
}

/**
 * Keep or undo what Quick AI just changed. The edits are already on the
 * builder (outlined, items tagged "AI"); Reject puts the catalogue back the
 * way it was before them.
 */
export function AiReviewBar({
	changes,
	busy,
	onAccept,
	onReject,
	variant,
}: AiReviewBarProps) {
	const [showDetails, setShowDetails] = useState(false);
	const listId = useId();
	const count = changes.length;

	return (
		<section
			aria-label="Review AI changes"
			className={cn(
				"rounded-2xl border border-product-primary/40 bg-product-card p-3 text-product-foreground",
				variant === "floating"
					? "fixed inset-x-3 bottom-[calc(env(safe-area-inset-bottom)+92px)] z-[1045] font-product-body shadow-product-hover md:inset-x-auto md:bottom-[88px] md:left-6 md:w-[360px]"
					: "mb-3",
			)}
		>
			<div className="flex items-start gap-2.5">
				<span
					aria-hidden="true"
					className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-product-primary-soft text-product-primary-ink"
				>
					<Sparkles className="h-3.5 w-3.5" />
				</span>
				<div className="min-w-0 flex-1">
					<p className="text-sm font-semibold leading-snug">
						{busy
							? "Quick AI is still making changes"
							: `${count} AI ${count === 1 ? "change" : "changes"} to review`}
					</p>
					<p className="text-xs leading-snug text-product-muted">
						Highlighted on your catalogue. Accept to keep them, or reject to
						undo them all.
					</p>
				</div>
			</div>

			{count > 0 && (
				<>
					<button
						aria-controls={listId}
						aria-expanded={showDetails}
						className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-product-foreground-accent transition-colors hover:text-product-foreground"
						onClick={() => setShowDetails((open) => !open)}
						type="button"
					>
						{showDetails ? "Hide details" : "Show details"}
						<ChevronDown
							aria-hidden="true"
							className={cn(
								"h-3.5 w-3.5 transition-transform",
								showDetails && "rotate-180",
							)}
						/>
					</button>
					{showDetails && (
						<ul
							className="mt-1.5 max-h-36 list-disc space-y-0.5 overflow-y-auto pl-5 text-xs leading-snug text-product-foreground-accent"
							id={listId}
						>
							{changes.map((change, index) => (
								<li key={`${index}-${change}`}>{change}</li>
							))}
						</ul>
					)}
				</>
			)}

			<div className="mt-3 flex gap-2">
				<Button
					className="flex-1"
					disabled={busy}
					onClick={onReject}
					size="sm"
					variant="outline"
				>
					<Undo2 aria-hidden="true" />
					Reject
				</Button>
				<Button className="flex-1" disabled={busy} onClick={onAccept} size="sm">
					<Check aria-hidden="true" />
					Accept
				</Button>
			</div>
		</section>
	);
}
