"use client";

import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import * as React from "react";

import { cn } from "@/lib/ui/cn";

// Frozen copy of the pre-redesign dialog for the published catalogue, which is themed by
// `--catalogue-*` and must not follow product `ui/dialog` changes. Its old `max-md:`
// classes are omitted on purpose: they never compiled, so the catalogue never had them.

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
	CatalogueDialogContent,
	CatalogueDialogDescription,
	CatalogueDialogHeader,
	CatalogueDialogTitle,
};
