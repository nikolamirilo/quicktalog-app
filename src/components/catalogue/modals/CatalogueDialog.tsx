"use client";

import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import * as React from "react";

import { cn } from "@/lib/ui/cn";

// Dialog parts for the published catalogue, which is themed by `--catalogue-*` and must
// not follow product `ui/dialog` changes. `CatalogueDialogContent` is a frozen copy of the
// pre-redesign dialog; its old `max-md:` classes are omitted on purpose: they never
// compiled, so the catalogue never had them.

const CatalogueDialog = DialogPrimitive.Root;

const CatalogueDialogContent = React.forwardRef<
	React.ElementRef<typeof DialogPrimitive.Content>,
	React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ className, children, ...props }, ref) => (
	<DialogPrimitive.Portal>
		<DialogPrimitive.Overlay className="catalogue-root fixed inset-0 z-50 bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
		<DialogPrimitive.Content
			className={cn(
				"fixed left-[50%] top-[50%] md:top-[50%] !z-[1100] grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border-none bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] rounded-lg sm:rounded-xl",
				"[-webkit-overflow-scrolling:touch]",
				className,
			)}
			ref={ref}
			{...props}
		>
			{children}
			<DialogPrimitive.Close className="absolute right-2 top-2 z-20 p-2 bg-black/50 text-white rounded-full opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
				<X className="h-4 w-4" />
				<span className="sr-only">Close</span>
			</DialogPrimitive.Close>
		</DialogPrimitive.Content>
	</DialogPrimitive.Portal>
));
CatalogueDialogContent.displayName = "CatalogueDialogContent";

const CatalogueDialogClose = DialogPrimitive.Close;

const catalogueOverlayClass =
	"catalogue-root fixed inset-0 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0";

/**
 * A bottom sheet below `md` and a centred 520px dialog from `md`, in the
 * redesign's shape but the catalogue's colours. Corners follow the
 * catalogue's corner setting through `--border-radius`; children use
 * `--catalogue-sheet-radius` and `--catalogue-pill-radius`. No close button
 * is built in.
 */
const CatalogueSheetContent = React.forwardRef<
	React.ElementRef<typeof DialogPrimitive.Content>,
	React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ className, children, ...props }, ref) => (
	<DialogPrimitive.Portal>
		<DialogPrimitive.Overlay
			className={cn(
				catalogueOverlayClass,
				"z-[1100] bg-black/[0.45] backdrop-blur-[3px]",
			)}
		/>
		<DialogPrimitive.Content
			className={cn(
				"catalogue-root fixed z-[1100] flex flex-col overflow-hidden bg-catalogue-card-background font-body text-catalogue-card-text outline-none",
				"[--catalogue-pill-radius:calc(var(--border-radius,12px)*999)] [--catalogue-sheet-radius:min(calc(var(--border-radius,12px)*2),28px)]",
				"shadow-[0_2px_4px_rgba(0,0,0,0.06),0_12px_28px_rgba(0,0,0,0.14),0_32px_64px_-20px_rgba(0,0,0,0.35)]",
				"transition-transform data-[state=open]:animate-in data-[state=closed]:animate-out",
				"bottom-0 left-0 right-0 max-h-[92dvh] rounded-t-[var(--catalogue-sheet-radius)] duration-300 data-[state=closed]:slide-out-to-bottom-full data-[state=open]:slide-in-from-bottom-full",
				"md:bottom-auto md:left-1/2 md:right-auto md:top-1/2 md:max-h-[min(88dvh,760px)] md:w-[520px] md:max-w-[calc(100vw-48px)] md:-translate-x-1/2 md:-translate-y-1/2 md:rounded-[var(--catalogue-sheet-radius)] md:duration-200",
				"md:data-[state=closed]:fade-out-0 md:data-[state=open]:fade-in-0 md:data-[state=closed]:slide-out-to-bottom-2 md:data-[state=open]:slide-in-from-bottom-2 md:data-[state=closed]:zoom-out-[0.98] md:data-[state=open]:zoom-in-[0.98]",
				className,
			)}
			ref={ref}
			{...props}
		>
			{children}
		</DialogPrimitive.Content>
	</DialogPrimitive.Portal>
));
CatalogueSheetContent.displayName = "CatalogueSheetContent";

/** Full-screen dark frame for one photo, above a sheet. No close button is built in. */
const CatalogueLightboxContent = React.forwardRef<
	React.ElementRef<typeof DialogPrimitive.Content>,
	React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ className, children, ...props }, ref) => (
	<DialogPrimitive.Portal>
		<DialogPrimitive.Overlay
			className={cn(catalogueOverlayClass, "z-[1110] bg-black/95")}
		/>
		<DialogPrimitive.Content
			className={cn(
				"catalogue-root fixed inset-0 z-[1110] flex items-center justify-center p-4 outline-none duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 md:p-10",
				className,
			)}
			ref={ref}
			{...props}
		>
			{children}
		</DialogPrimitive.Content>
	</DialogPrimitive.Portal>
));
CatalogueLightboxContent.displayName = "CatalogueLightboxContent";

const CatalogueDialogHeader = ({
	className,
	...props
}: React.HTMLAttributes<HTMLDivElement>) => (
	<div
		className={cn(
			"flex flex-col space-y-1.5 text-center sm:text-left",
			className,
		)}
		{...props}
	/>
);

const CatalogueDialogTitle = React.forwardRef<
	React.ElementRef<typeof DialogPrimitive.Title>,
	React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
	<DialogPrimitive.Title
		className={cn(
			"text-lg font-semibold leading-none tracking-tight",
			className,
		)}
		ref={ref}
		{...props}
	/>
));
CatalogueDialogTitle.displayName = "CatalogueDialogTitle";

const CatalogueDialogDescription = React.forwardRef<
	React.ElementRef<typeof DialogPrimitive.Description>,
	React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
	<DialogPrimitive.Description
		className={cn("text-sm text-muted-foreground", className)}
		ref={ref}
		{...props}
	/>
));
CatalogueDialogDescription.displayName = "CatalogueDialogDescription";

export {
	CatalogueDialog,
	CatalogueDialogClose,
	CatalogueDialogContent,
	CatalogueDialogDescription,
	CatalogueDialogHeader,
	CatalogueDialogTitle,
	CatalogueLightboxContent,
	CatalogueSheetContent,
};
