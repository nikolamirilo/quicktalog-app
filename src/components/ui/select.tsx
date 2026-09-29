"use client";

import * as SelectPrimitive from "@radix-ui/react-select";
import { Check, ChevronDown, ChevronUp } from "lucide-react";
import * as React from "react";

import { cn } from "@/lib/ui/cn";

const Select = SelectPrimitive.Root;

const SelectGroup = SelectPrimitive.Group;

const SelectValue = SelectPrimitive.Value;

const SelectTrigger = React.forwardRef<
	React.ElementRef<typeof SelectPrimitive.Trigger>,
	React.ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger>
>(({ className, children, ...props }, ref) => (
	<SelectPrimitive.Trigger
		className={cn(
			"flex h-11 w-full items-center justify-between gap-2 rounded-[14px] px-4 text-left text-base md:text-[15px] border-[1.5px] border-product-border-strong bg-product-card text-product-foreground transition-[border-color,box-shadow] placeholder:text-product-muted hover:border-product-border-hover focus:outline-none focus:border-product-primary focus:ring-4 focus:ring-product-primary/25 aria-[invalid=true]:border-product-error aria-[invalid=true]:ring-4 aria-[invalid=true]:ring-product-error/10 disabled:cursor-not-allowed disabled:opacity-50 data-[placeholder]:text-product-muted [&>span]:line-clamp-1",
			className,
		)}
		ref={ref}
		translate="no"
		{...props}
	>
		<span className="notranslate" translate="no">
			{children}
		</span>
		<SelectPrimitive.Icon asChild>
			<ChevronDown
				className={cn(
					"h-4 w-4 shrink-0 text-product-muted transition-transform duration-200 ease-in-out",
					"data-[state=open]:rotate-180",
				)}
			/>
		</SelectPrimitive.Icon>
	</SelectPrimitive.Trigger>
));
SelectTrigger.displayName = SelectPrimitive.Trigger.displayName;

const SelectScrollUpButton = React.forwardRef<
	React.ElementRef<typeof SelectPrimitive.ScrollUpButton>,
	React.ComponentPropsWithoutRef<typeof SelectPrimitive.ScrollUpButton>
>(({ className, ...props }, ref) => (
	<SelectPrimitive.ScrollUpButton
		className={cn(
			"flex cursor-default items-center justify-center py-1 text-product-foreground",
			className,
		)}
		ref={ref}
		translate="no"
		{...props}
	>
		<ChevronUp className="h-4 w-4 text-product-muted" />
	</SelectPrimitive.ScrollUpButton>
));
SelectScrollUpButton.displayName = SelectPrimitive.ScrollUpButton.displayName;

const SelectScrollDownButton = React.forwardRef<
	React.ElementRef<typeof SelectPrimitive.ScrollDownButton>,
	React.ComponentPropsWithoutRef<typeof SelectPrimitive.ScrollDownButton>
>(({ className, ...props }, ref) => (
	<SelectPrimitive.ScrollDownButton
		className={cn(
			"flex cursor-default items-center justify-center py-1 text-product-foreground",
			className,
		)}
		ref={ref}
		translate="no"
		{...props}
	>
		<ChevronDown className="h-4 w-4 text-product-muted" />
	</SelectPrimitive.ScrollDownButton>
));
SelectScrollDownButton.displayName =
	SelectPrimitive.ScrollDownButton.displayName;

const SelectContent = React.forwardRef<
	React.ElementRef<typeof SelectPrimitive.Content>,
	React.ComponentPropsWithoutRef<typeof SelectPrimitive.Content>
>(({ className, children, position = "popper", ...props }, ref) => (
	<SelectPrimitive.Portal>
		<SelectPrimitive.Content
			className={cn(
				"relative z-[2000] max-h-[--radix-select-content-available-height] min-w-[8rem] overflow-y-auto overflow-x-hidden rounded-[18px] border border-product-border bg-product-card text-product-foreground shadow-product-hover data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 origin-[--radix-select-content-transform-origin] notranslate",
				position === "popper" &&
					"data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1",
				// iOS Safari fixes
				"[-webkit-overflow-scrolling:touch]",
				className,
			)}
			position={position}
			ref={ref}
			translate="no"
			{...props}
		>
			<SelectScrollUpButton />
			<SelectPrimitive.Viewport
				className={cn(
					"p-1.5 notranslate",
					position === "popper" &&
						"h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)]",
				)}
				translate="no"
			>
				{children}
			</SelectPrimitive.Viewport>
			<SelectScrollDownButton />
		</SelectPrimitive.Content>
	</SelectPrimitive.Portal>
));
SelectContent.displayName = SelectPrimitive.Content.displayName;

const SelectLabel = React.forwardRef<
	React.ElementRef<typeof SelectPrimitive.Label>,
	React.ComponentPropsWithoutRef<typeof SelectPrimitive.Label>
>(({ className, children, ...props }, ref) => (
	<SelectPrimitive.Label
		className={cn(
			"px-3 py-1.5 text-xs font-bold uppercase tracking-[0.06em] text-product-muted",
			className,
		)}
		ref={ref}
		translate="no"
		{...props}
	>
		<span className="notranslate" translate="no">
			{children}
		</span>
	</SelectPrimitive.Label>
));
SelectLabel.displayName = SelectPrimitive.Label.displayName;

const SelectItem = React.forwardRef<
	React.ElementRef<typeof SelectPrimitive.Item>,
	React.ComponentPropsWithoutRef<typeof SelectPrimitive.Item>
>(({ className, children, ...props }, ref) => (
	<SelectPrimitive.Item
		className={cn(
			"relative flex min-h-10 w-full cursor-pointer select-none items-center rounded-[12px] py-2 pl-3 pr-9 text-sm font-medium text-product-foreground outline-none transition-colors focus:bg-product-background-hero data-[state=checked]:bg-product-primary-soft data-[state=checked]:font-semibold data-[disabled]:pointer-events-none data-[disabled]:opacity-50 notranslate",
			className,
		)}
		ref={ref}
		translate="no"
		{...props}
	>
		<span className="absolute right-3 flex h-3.5 w-3.5 items-center justify-center">
			<SelectPrimitive.ItemIndicator>
				<Check className="h-4 w-4 text-product-primary-ink" />
			</SelectPrimitive.ItemIndicator>
		</span>
		<SelectPrimitive.ItemText>
			<span className="notranslate" translate="no">
				{children}
			</span>
		</SelectPrimitive.ItemText>
	</SelectPrimitive.Item>
));
SelectItem.displayName = SelectPrimitive.Item.displayName;

const SelectSeparator = React.forwardRef<
	React.ElementRef<typeof SelectPrimitive.Separator>,
	React.ComponentPropsWithoutRef<typeof SelectPrimitive.Separator>
>(({ className, ...props }, ref) => (
	<SelectPrimitive.Separator
		className={cn("-mx-1 my-1 h-px bg-product-border", className)}
		ref={ref}
		translate="no"
		{...props}
	/>
));
SelectSeparator.displayName = SelectPrimitive.Separator.displayName;

export {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectLabel,
	SelectScrollDownButton,
	SelectScrollUpButton,
	SelectSeparator,
	SelectTrigger,
	SelectValue,
};
