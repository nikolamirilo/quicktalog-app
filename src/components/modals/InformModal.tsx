import type { ReactElement } from "react";

import {
	AppDialogContent,
	AppDialogFooter,
	AppDialogIcon,
	type AppDialogTone,
} from "@/components/modals/AppDialog";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogDescription,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/ui/cn";

interface InformModalProps {
	isOpen: boolean;
	onConfirm: () => void;
	onCancel?: () => void;
	title: string;
	message: string;
	confirmText?: string;
	cancelText?: string;
	loading?: boolean;
	image?: string;
	imageAlt?: string;
	/** Shown in a 46px tile above the title. */
	icon?: ReactElement;
	/** Tile colour; `red` also turns the confirm button destructive. */
	tone?: AppDialogTone;
	/** Leave closing to the caller, so `loading` can show while it works. */
	keepOpenOnConfirm?: boolean;
}

/** Small confirm / explainer dialog (`.as-dlg-sm`). */
export function InformModal({
	isOpen,
	onConfirm,
	onCancel,
	title,
	message,
	confirmText = "Confirm",
	cancelText = "Cancel",
	loading = false,
	image,
	imageAlt = "Screenshot",
	icon,
	tone = "amber",
	keepOpenOnConfirm = false,
}: InformModalProps) {
	return (
		<AlertDialog
			onOpenChange={(open) => {
				if (!open && onCancel) onCancel();
			}}
			open={isOpen}
		>
			<AppDialogContent size="sm">
				{icon && <AppDialogIcon tone={tone}>{icon}</AppDialogIcon>}
				<AlertDialogTitle>{title}</AlertDialogTitle>
				<AlertDialogDescription className="text-sm">
					{message}
				</AlertDialogDescription>
				{image && (
					<div className="overflow-hidden rounded-2xl border border-product-border">
						<img
							alt={imageAlt}
							className="h-auto max-h-64 w-full object-cover"
							src={image}
						/>
					</div>
				)}
				<AppDialogFooter>
					{onCancel && cancelText && (
						<AlertDialogCancel className="mt-0" disabled={loading}>
							{cancelText}
						</AlertDialogCancel>
					)}
					<AlertDialogAction
						aria-busy={loading || undefined}
						className={cn(
							tone === "red" && buttonVariants({ variant: "destructive" }),
						)}
						disabled={loading}
						onClick={(event) => {
							if (keepOpenOnConfirm) event.preventDefault();
							onConfirm();
						}}
					>
						{loading ? "Processing..." : confirmText}
					</AlertDialogAction>
				</AppDialogFooter>
			</AppDialogContent>
		</AlertDialog>
	);
}
