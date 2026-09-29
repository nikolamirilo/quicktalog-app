"use client";

import { Minus, Plus } from "lucide-react";
import { type ReactNode, useEffect, useId, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/ui/cn";
import type { IFAQ } from "@/types/shared";

type FaqAccordionProps = {
	items: IFAQ[];
	/** Show this many first, with a "Load more" button for the rest. */
	initialCount?: number;
	/** Wraps matches of this text in `<mark>`. */
	highlight?: string;
	/**
	 * Open the items whose question or answer contains `highlight`: on first
	 * render and again whenever `highlight` changes. Items the visitor opened
	 * or closed by hand keep their state until a new match opens them.
	 */
	openMatches?: boolean;
	className?: string;
};

function highlightText(text: string, query?: string): ReactNode {
	const needle = query?.trim();
	if (!needle) return text;
	const escaped = needle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
	return text.split(new RegExp(`(${escaped})`, "gi")).map((part, index) =>
		part.toLowerCase() === needle.toLowerCase() ? (
			<mark className="rounded bg-product-primary/35 text-inherit" key={index}>
				{part}
			</mark>
		) : (
			part
		),
	);
}

/** Questions of the items whose question or answer contains `needle`. */
function matchingQuestions(items: IFAQ[], needle: string): string[] {
	return items
		.filter(
			(item) =>
				item.question.toLowerCase().includes(needle) ||
				item.answer.toLowerCase().includes(needle),
		)
		.map((item) => item.question);
}

export function FaqAccordion({
	items,
	initialCount,
	highlight,
	openMatches = false,
	className,
}: FaqAccordionProps) {
	const baseId = useId();
	const needle = highlight?.trim().toLowerCase() ?? "";
	// Keyed by question (unique, and the React key), so the open state survives
	// the list being filtered or re-ordered without a remount.
	const [open, setOpen] = useState<Set<string>>(
		() =>
			new Set(openMatches && needle ? matchingQuestions(items, needle) : []),
	);
	// A new search term opens its matches on top of what is already open.
	// Adjusting state during render avoids a flash of closed items.
	const [openedFor, setOpenedFor] = useState(needle);
	if (needle !== openedFor) {
		setOpenedFor(needle);
		if (openMatches && needle) {
			const matches = matchingQuestions(items, needle);
			setOpen((current) => new Set([...current, ...matches]));
		}
	}
	const [showAll, setShowAll] = useState(false);
	const firstExtraRef = useRef<HTMLButtonElement>(null);
	const revealedRef = useRef(false);

	useEffect(() => {
		if (showAll && revealedRef.current) firstExtraRef.current?.focus();
	}, [showAll]);

	const collapsed =
		!showAll && initialCount !== undefined && items.length > initialCount;
	const visible = collapsed ? items.slice(0, initialCount) : items;

	const toggle = (question: string) =>
		setOpen((current) => {
			const next = new Set(current);
			next.has(question) ? next.delete(question) : next.add(question);
			return next;
		});

	return (
		<div
			className={cn("mx-auto flex max-w-[896px] flex-col gap-3.5", className)}
		>
			{visible.map((item, index) => {
				const isOpen = open.has(item.question);
				const buttonId = `${baseId}-q-${index}`;
				const panelId = `${baseId}-a-${index}`;
				return (
					<div
						className={cn(
							"rounded-[20px] border bg-product-card transition-[border-color,box-shadow]",
							isOpen
								? "border-product-primary/60 shadow-product"
								: "border-product-border shadow-[0_1px_2px_rgba(22,20,15,0.04),0_6px_16px_-10px_rgba(22,20,15,0.12)]",
						)}
						key={item.question}
					>
						<h3 className="font-product-body text-base tracking-normal">
							<button
								aria-controls={panelId}
								aria-expanded={isOpen}
								className="flex w-full items-center justify-between gap-4 rounded-[20px] px-[22px] py-5 text-left text-[17px] font-semibold leading-snug text-product-foreground transition-colors hover:text-product-primary-ink"
								id={buttonId}
								onClick={() => toggle(item.question)}
								ref={
									initialCount !== undefined && index === initialCount
										? firstExtraRef
										: undefined
								}
								type="button"
							>
								<span>{highlightText(item.question, highlight)}</span>
								<span
									aria-hidden="true"
									className={cn(
										"grid h-[34px] w-[34px] flex-none place-items-center rounded-full transition-[background-color,transform] duration-300",
										isOpen
											? "rotate-180 bg-product-primary text-product-foreground"
											: "bg-product-background-hero text-product-foreground-accent",
									)}
								>
									{isOpen ? (
										<Minus className="h-[17px] w-[17px]" />
									) : (
										<Plus className="h-[17px] w-[17px]" />
									)}
								</span>
							</button>
						</h3>
						<div
							aria-labelledby={buttonId}
							className="px-[22px] pb-[22px] text-base leading-[1.7] text-product-foreground-accent"
							hidden={!isOpen}
							id={panelId}
							role="region"
						>
							{highlightText(item.answer, highlight)}
						</div>
					</div>
				);
			})}
			{collapsed && (
				<div className="mt-[18px] text-center">
					<Button
						onClick={() => {
							revealedRef.current = true;
							setShowAll(true);
						}}
						variant="outline"
					>
						Load More Questions
					</Button>
				</div>
			)}
		</div>
	);
}
