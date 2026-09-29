"use client";
import { X } from "lucide-react";
import type { HTMLAttributes } from "react";
import { AppDialogFooter } from "@/components/modals/AppDialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/ui/cn";

/**
 * Frame classes for a builder dialog built on `AppDialogContent`: no padding,
 * a fixed header and footer, and a body that scrolls between them. The
 * `max-md:` pair overrides the alert dialog's phone defaults (85dvh, whole
 * dialog scrolling) so the footer stays in view.
 */
export const builderDialogFrame =
	"gap-0 overflow-hidden p-0 max-md:max-h-[calc(100dvh-24px)] max-md:overflow-hidden";

/** Round ghost close button used in every builder dialog header. */
export function BuilderDialogClose({
	onClick,
	className,
}: {
	onClick: () => void;
	className?: string;
}) {
	return (
		<Button
			aria-label="Close"
			className={cn("-mr-2 -mt-1 flex-none", className)}
			onClick={onClick}
			size="icon"
			type="button"
			variant="ghost"
		>
			<X aria-hidden="true" className="!size-5" />
		</Button>
	);
}

/** Title row: text on the left, close button on the right. */
export function BuilderDialogHeader({
	className,
	...props
}: HTMLAttributes<HTMLDivElement>) {
	return (
		<div
			className={cn(
				"flex flex-none items-start justify-between gap-3 border-b border-product-border px-5 pb-4 pt-5 sm:px-6",
				className,
			)}
			{...props}
		/>
	);
}

/** The part that scrolls. */
export function BuilderDialogBody({
	className,
	...props
}: HTMLAttributes<HTMLDivElement>) {
	return (
		<div
			className={cn(
				"min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-5 sm:px-6",
				className,
			)}
			{...props}
		/>
	);
}

/** `AppDialogFooter` pinned under the body, with a top rule. */
export function BuilderDialogFooter({
	className,
	...props
}: HTMLAttributes<HTMLDivElement>) {
	return (
		<AppDialogFooter
			className={cn(
				"mt-0 flex-none border-t border-product-border bg-product-card px-5 py-4 sm:px-6",
				className,
			)}
			{...props}
		/>
	);
}
