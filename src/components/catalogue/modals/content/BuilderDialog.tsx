"use client";
import { X } from "lucide-react";
import type { HTMLAttributes } from "react";
import { AppDialogFooter } from "@/components/modals/AppDialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/ui/cn";

/**
 * Frame classes for a builder dialog built on `AppDialogContent`: no padding,
 * a fixed header and footer, and a body that scrolls between them. Below `md`
 * it is a bottom sheet: full width, pinned to the bottom and sliding up, which
 * replaces the alert dialog's centred phone position and zoom.
 */
export const builderDialogFrame = [
	"gap-0 overflow-hidden p-0",
	"max-md:bottom-0 max-md:left-0 max-md:right-0 max-md:top-auto max-md:mx-0 max-md:w-full max-md:max-w-none max-md:translate-x-0 max-md:translate-y-0",
	"max-md:max-h-[calc(100dvh-24px)] max-md:overflow-hidden max-md:rounded-b-none max-md:rounded-t-[24px] max-md:border-x-0 max-md:border-b-0",
	"max-md:data-[state=open]:slide-in-from-bottom-full max-md:data-[state=open]:slide-in-from-left-0 max-md:data-[state=open]:zoom-in-100",
	"max-md:data-[state=closed]:slide-out-to-bottom-full max-md:data-[state=closed]:slide-out-to-left-0 max-md:data-[state=closed]:zoom-out-100",
].join(" ");

/**
 * Compact size for inputs and select triggers in builder dialogs, so every
 * dialog uses the same field height. Text stays 16px on phones (iOS zoom).
 */
export const builderFieldClass = "h-10 rounded-[12px] px-3";

/** Compact textarea to match `builderFieldClass`. */
export const builderTextareaClass = "rounded-[12px] px-3 py-2.5";

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
				"flex flex-none items-start justify-between gap-3 border-b border-product-border px-4 pb-3 pt-4 md:px-6 md:pb-4 md:pt-5",
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
				"min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4 md:px-6 md:py-5",
				className,
			)}
			{...props}
		/>
	);
}

/** `AppDialogFooter` pinned under the body, with a top rule; clears the iPhone home bar. */
export function BuilderDialogFooter({
	className,
	...props
}: HTMLAttributes<HTMLDivElement>) {
	return (
		<AppDialogFooter
			className={cn(
				"mt-0 flex-none border-t border-product-border bg-product-card px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 md:px-6 md:py-4",
				className,
			)}
			{...props}
		/>
	);
}
