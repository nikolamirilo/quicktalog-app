"use client";
import type {
	ComponentPropsWithoutRef,
	HTMLAttributes,
	ReactNode,
} from "react";

import { AlertDialogContent } from "@/components/ui/alert-dialog";
import { cn } from "@/lib/ui/cn";

const SIZES = {
	/** Confirm and explainer dialogs. */
	sm: "max-w-[440px]",
	/** Forms (create catalogue) and the plan-limit dialog. */
	md: "max-w-[600px]",
	/** Lists (choose catalogues to delete). */
	lg: "max-w-3xl",
};

type AppDialogContentProps = ComponentPropsWithoutRef<
	typeof AlertDialogContent
> & {
	size?: keyof typeof SIZES;
};

/**
 * Content frame of an app dialog (`.as-dlg`): a column that scrolls inside the
 * viewport, 440 / 600 / 768px wide. Built on the alert dialog, so it needs an
 * `AlertDialogTitle` and `AlertDialogDescription` inside.
 */
export function AppDialogContent({
	size = "md",
	className,
	...props
}: AppDialogContentProps) {
	return (
		<AlertDialogContent
			className={cn(
				"flex max-h-[calc(100dvh-24px)] w-[calc(100vw-24px)] flex-col gap-3.5 overflow-y-auto p-6 text-left",
				SIZES[size],
				className,
			)}
			{...props}
		/>
	);
}

/** Footer row: buttons share the width on phones and sit right from 520px. */
export function AppDialogFooter({
	className,
	...props
}: HTMLAttributes<HTMLDivElement>) {
	return (
		<div
			className={cn(
				"mt-1 flex flex-row flex-wrap justify-end gap-2 [&>*]:mt-0 [&>*]:flex-[1_1_140px] min-[520px]:[&>*]:flex-none",
				className,
			)}
			{...props}
		/>
	);
}

const ICON_TONES = {
	amber: "bg-product-primary-soft text-product-primary-ink",
	red: "bg-product-error-soft text-product-error",
	green: "bg-product-success-soft text-product-success",
};

export type AppDialogTone = keyof typeof ICON_TONES;

/** 46px icon tile at the top of an app dialog (`.as-dlg-ic`). */
export function AppDialogIcon({
	children,
	tone = "amber",
	className,
}: {
	children: ReactNode;
	tone?: AppDialogTone;
	className?: string;
}) {
	return (
		<span
			aria-hidden="true"
			className={cn(
				"grid h-[46px] w-[46px] flex-none place-items-center rounded-[14px] [&_svg]:size-[22px]",
				ICON_TONES[tone],
				className,
			)}
		>
			{children}
		</span>
	);
}
