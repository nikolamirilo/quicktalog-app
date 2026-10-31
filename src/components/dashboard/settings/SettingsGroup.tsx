"use client";

import { type ReactNode, useEffect, useId, useRef } from "react";

import { AppCardTitle } from "@/components/dashboard/common/AppHeadings";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/ui/cn";

type Tone = "default" | "danger";

/** One settings card: a title and a list of `SettingsRow`s. */
export function SettingsGroup({
	title,
	children,
	tone = "default",
}: {
	title: string;
	children: ReactNode;
	tone?: Tone;
}) {
	const id = useId();
	return (
		<section
			aria-labelledby={id}
			className={cn(
				"overflow-hidden rounded-product-card border bg-product-card shadow-product",
				tone === "danger" ? "border-product-error/30" : "border-product-border",
			)}
		>
			<AppCardTitle
				className={cn(
					"px-[18px] pb-2.5 pt-4 md:px-6 md:pt-[18px]",
					tone === "danger" && "text-product-error",
				)}
				id={id}
			>
				{title}
			</AppCardTitle>
			{children}
		</section>
	);
}

type SettingsRowProps = {
	label: string;
	/** The current value (a name, an address). Reads strongest on phones. */
	value?: ReactNode;
	/** A sentence about the row, for rows that have no value to show. */
	description?: ReactNode;
	/** Buttons at the end of the row. */
	action?: ReactNode;
	/** Label of the button that opens `children` in place of the value. */
	editLabel?: string;
	open?: boolean;
	onOpenChange?: (open: boolean) => void;
	/** The editor shown while `open`; it closes itself through `onOpenChange`. */
	children?: ReactNode;
	tone?: Tone;
};

/**
 * Label, value and action on one line from `lg`; below that the label sits above
 * the value and the actions wrap below when they do not fit beside it. `md` is
 * too early: the dashboard sidebar appears there and leaves too little width.
 */
export function SettingsRow({
	label,
	value,
	description,
	action,
	editLabel,
	open = false,
	onOpenChange,
	children,
	tone = "default",
}: SettingsRowProps) {
	const editorId = useId();
	const editorRef = useRef<HTMLDivElement>(null);
	const toggleRef = useRef<HTMLButtonElement>(null);
	const wasOpen = useRef(open);

	useEffect(() => {
		if (open) {
			editorRef.current
				?.querySelector<HTMLElement>("input, textarea, select, button")
				?.focus();
		} else if (wasOpen.current && document.activeElement === document.body) {
			// Closing unmounts the focused editor; hand focus back to its opener.
			toggleRef.current?.focus();
		}
		wasOpen.current = open;
	}, [open]);

	const hasActions = !open && (action || editLabel);

	return (
		<div
			className={cn(
				"border-t border-product-border px-[18px] py-3 md:px-6 md:py-3.5",
				open && "bg-product-primary-soft/40 py-4 md:py-5",
			)}
		>
			<div
				className={cn(
					"flex flex-wrap items-center gap-x-3 gap-y-2.5 lg:grid lg:gap-4",
					open
						? "items-start lg:grid-cols-[180px_minmax(0,1fr)]"
						: "lg:grid-cols-[180px_minmax(0,1fr)_auto]",
				)}
			>
				<div className="flex min-w-0 flex-[1_1_180px] flex-col gap-0.5 lg:contents">
					<span
						className={cn(
							"lg:text-sm lg:font-semibold lg:text-product-foreground",
							description && !open
								? "text-[15px] font-medium text-product-foreground"
								: "text-[13px] text-product-muted",
							tone === "danger" && "text-product-error lg:text-product-error",
						)}
					>
						{label}
					</span>
					{open ? (
						<div
							className="flex w-full max-w-[480px] flex-col gap-3 pt-1.5 lg:pt-0"
							id={editorId}
							ref={editorRef}
						>
							{children}
						</div>
					) : description ? (
						<p className="min-w-0 text-[13px] leading-normal text-product-foreground-accent md:text-sm">
							{description}
						</p>
					) : (
						<div className="min-w-0 text-[15px] font-medium text-product-foreground [overflow-wrap:anywhere] lg:font-normal lg:text-product-foreground-accent">
							{value}
						</div>
					)}
				</div>
				{hasActions && (
					<div className="flex w-full flex-col gap-2 sm:w-auto">
						{action}
						{editLabel && (
							<Button
								aria-controls={editorId}
								aria-expanded={false}
								onClick={() => onOpenChange?.(true)}
								ref={toggleRef}
								size="sm"
								variant="outline"
							>
								{editLabel}
							</Button>
						)}
					</div>
				)}
			</div>
		</div>
	);
}

/** Save and Cancel under a row's editor. */
export function SettingsEditorActions({
	onCancel,
	children,
}: {
	onCancel: () => void;
	/** The submit button. */
	children: ReactNode;
}) {
	return (
		<div className="flex flex-wrap items-center gap-2">
			{children}
			<Button onClick={onCancel} size="sm" variant="ghost">
				Cancel
			</Button>
		</div>
	);
}

/** Status line under a value or an editor, e.g. "Check both inboxes". */
export function SettingsHint({ children }: { children: ReactNode }) {
	return (
		<p
			aria-live="polite"
			className="mt-1 text-[12.5px] font-normal text-product-success"
			role="status"
		>
			{children}
		</p>
	);
}
