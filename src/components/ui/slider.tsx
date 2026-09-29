"use client";

import * as SliderPrimitive from "@radix-ui/react-slider";
import * as React from "react";

import { cn } from "@/lib/ui/cn";

const Slider = React.forwardRef<
	React.ElementRef<typeof SliderPrimitive.Root>,
	React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root>
>(
	(
		{
			className,
			"aria-label": ariaLabel,
			"aria-labelledby": ariaLabelledBy,
			...props
		},
		ref,
	) => (
		<SliderPrimitive.Root
			className={cn(
				"relative flex w-full touch-none select-none items-center cursor-pointer group",
				className,
			)}
			ref={ref}
			{...props}
		>
			<SliderPrimitive.Track className="relative h-1.5 w-full grow overflow-hidden rounded-full bg-product-border-strong">
				<SliderPrimitive.Range className="absolute h-full bg-product-primary-accent" />
			</SliderPrimitive.Track>
			{/* The focusable thumb is the element screen readers announce, so it carries the name. */}
			<SliderPrimitive.Thumb
				aria-label={ariaLabel}
				aria-labelledby={ariaLabelledBy}
				className="block h-[22px] w-[22px] rounded-full border-2 border-product-primary bg-white shadow-[0_2px_6px_rgba(22,20,15,0.18)] transition-transform focus-visible:outline-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:scale-110"
			/>
		</SliderPrimitive.Root>
	),
);
Slider.displayName = SliderPrimitive.Root.displayName;

export { Slider };
