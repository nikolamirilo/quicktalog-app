"use client";
import * as AlertDialogPrimitive from "@radix-ui/react-alert-dialog";
import * as React from "react";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/ui/cn";

const AlertDialog = AlertDialogPrimitive.Root;
const AlertDialogTrigger = AlertDialogPrimitive.Trigger;
const AlertDialogPortal = AlertDialogPrimitive.Portal;

const AlertDialogOverlay = React.forwardRef<
	React.ElementRef<typeof AlertDialogPrimitive.Overlay>,
	React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
	<AlertDialogPrimitive.Overlay
		className={cn(
			"z-[1150] fixed inset-0 bg-[rgba(22,20,15,0.42)] backdrop-blur-[4px] data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 notranslate",
			className,
		)}
		ref={ref}
		translate="no"
		{...props}
	/>
));
AlertDialogOverlay.displayName = AlertDialogPrimitive.Overlay.displayName;

const AlertDialogContent = React.forwardRef<
	React.ElementRef<typeof AlertDialogPrimitive.Content>,
	React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Content>
>(({ className, children, ...props }, ref) => (
	<AlertDialogPortal>
		<AlertDialogOverlay />
		<AlertDialogPrimitive.Content
			className={cn(
				"!z-[1200] fixed left-[50%] top-[40dvh] md:top-[50%] grid w-[calc(100%-32px)] sm:w-full max-w-lg translate-x-[-50%] translate-y-[-40%] md:translate-y-[-50%] max-md:max-h-[85dvh] max-md:overflow-y-auto gap-4 border border-product-border bg-product-card p-6 text-product-foreground shadow-product-hover rounded-product-panel duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] notranslate mx-auto",
				"[-webkit-overflow-scrolling:touch]",
				className,
			)}
			ref={ref}
			translate="no"
			{...props}
		>
			{children}
		</AlertDialogPrimitive.Content>
	</AlertDialogPortal>
));
AlertDialogContent.displayName = AlertDialogPrimitive.Content.displayName;

const AlertDialogHeader = ({
	className,
	children,
	...props
}: React.HTMLAttributes<HTMLDivElement>) => (
	<div
		className={cn(
			"flex flex-col space-y-2 text-center sm:text-left notranslate",
			className,
		)}
		translate="no"
		{...props}
	>
		<span className="notranslate" translate="no">
			{children}
		</span>
	</div>
);
AlertDialogHeader.displayName = "AlertDialogHeader";

const AlertDialogFooter = ({
	className,
	children,
	...props
}: React.HTMLAttributes<HTMLDivElement>) => (
	<div
		className={cn(
			"flex flex-col-reverse gap-3 sm:flex-row sm:justify-end sm:space-x-2 notranslate",
			className,
		)}
		translate="no"
		{...props}
	>
		{children}
	</div>
);
AlertDialogFooter.displayName = "AlertDialogFooter";

const AlertDialogTitle = React.forwardRef<
	React.ElementRef<typeof AlertDialogPrimitive.Title>,
	React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Title>
>(({ className, children, ...props }, ref) => (
	<AlertDialogPrimitive.Title
		className={cn(
			"font-product-heading text-xl font-bold leading-tight tracking-[-0.02em] text-product-foreground notranslate",
			className,
		)}
		ref={ref}
		translate="no"
		{...props}
	>
		<span className="notranslate" translate="no">
			{children}
		</span>
	</AlertDialogPrimitive.Title>
));
AlertDialogTitle.displayName = AlertDialogPrimitive.Title.displayName;

const AlertDialogDescription = React.forwardRef<
	React.ElementRef<typeof AlertDialogPrimitive.Description>,
	React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Description>
>(({ className, children, ...props }, ref) => (
	<AlertDialogPrimitive.Description
		className={cn(
			"text-[15px] leading-relaxed text-product-foreground-accent notranslate",
			className,
		)}
		ref={ref}
		translate="no"
		{...props}
	>
		<span className="notranslate" translate="no">
			{children}
		</span>
	</AlertDialogPrimitive.Description>
));
AlertDialogDescription.displayName =
	AlertDialogPrimitive.Description.displayName;

const AlertDialogAction = React.forwardRef<
	React.ElementRef<typeof AlertDialogPrimitive.Action>,
	React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Action>
>(({ className, children, ...props }, ref) => (
	<AlertDialogPrimitive.Action
		className={cn(buttonVariants(), "notranslate", className)}
		ref={ref}
		translate="no"
		{...props}
	>
		{children}
	</AlertDialogPrimitive.Action>
));
AlertDialogAction.displayName = AlertDialogPrimitive.Action.displayName;

const AlertDialogCancel = React.forwardRef<
	React.ElementRef<typeof AlertDialogPrimitive.Cancel>,
	React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Cancel>
>(({ className, children, ...props }, ref) => (
	<AlertDialogPrimitive.Cancel
		className={cn(
			buttonVariants({ variant: "outline" }),
			"mt-2 sm:mt-0 notranslate",
			className,
		)}
		ref={ref}
		translate="no"
		{...props}
	>
		{children}
	</AlertDialogPrimitive.Cancel>
));
AlertDialogCancel.displayName = AlertDialogPrimitive.Cancel.displayName;

export {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogOverlay,
	AlertDialogPortal,
	AlertDialogTitle,
	AlertDialogTrigger,
};
