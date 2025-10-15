//@ts-nocheck
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";

import { cn } from "@/helpers/client";

const buttonVariants = cva(
	"inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-all duration-200 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
	{
		variants: {
			variant: {
				default: `
          bg-product-primary 
          text-button-text
          shadow 
          hover:shadow-md 
          hover:text-product-foreground 
          hover:scale-[1.02]
        `,
				destructive: `
          bg-red-500 
          text-white 
          hover:bg-red-600 
          shadow-sm
        `,
				outline: `
          border border-product-border 
          bg-transparent 
          text-product-foreground 
          hover:bg-product-hover-background 
          hover:text-product-foreground-accent 
          transition-colors shadow-sm
        `,
				secondary: `
          bg-product-background 
          text-product-foreground-accent 
          border border-product-border 
          hover:bg-product-hover-background 
          hover:text-product-background 
          shadow-sm
        `,
				ghost: `
          text-product-foreground 
          hover:bg-product-hover-background 
          hover:text-product-foreground-accent
        `,
				success: `
          bg-green-500 
          text-white 
          hover:bg-green-600
        `,
				link: `
          text-product-secondary 
          underline-offset-4 
          hover:underline
        `,
				"primary-inverted": `
          bg-product-background 
          text-product-primary 
          border-2 border-product-primary 
          hover:bg-product-hover-background 
          hover:text-product-foreground 
          hover:border-primary-accent 
          shadow
        `,
				store: `
          flex items-center justify-center min-w-[205px] mt-3 px-6 h-14 w-full sm:w-fit
          text-white bg-product-foreground
        `,
				"store-light": `
          flex items-center justify-center min-w-[205px] mt-3 px-6 h-14 w-full sm:w-fit
          text-product-foreground bg-product-background
        `,
				cta: `
          w-full py-3 px-4 font-semibold transition-all duration-300 transform overflow-hidden group/btn
          bg-product-primary hover:bg-product-primary-accent text-product-foreground shadow-lg hover:shadow-xl
          hover:scale-[1.03] hover:-translate-y-[2px]
        `,
				"cta-secondary": `
          w-full py-3 px-4 font-semibold transition-all duration-300 transform overflow-hidden group/btn
          bg-hero-product-background hover:bg-product-primary text-product-foreground shadow-md hover:shadow-lg
        `,
				header: `
          text-black bg-product-primary hover:bg-product-primary-accent px-8 py-3 transition-colors
        `,
				"header-mobile": `
          text-black bg-product-primary hover:bg-product-primary-accent px-5 py-2 block w-fit
        `,
				contact: `
          group relative bg-product-primary hover:bg-primary-accent text-product-foreground px-12 py-4 font-semibold transition-all duration-300 transform hover:scale-product-hover-scale hover:shadow-product-hover-shadow disabled:opacity-30 disabled:cursor-not-allowed disabled:transform-none min-w-[200px]`,
				"section-header": `
          w-full group relative flex items-center justify-between 
          px-4 py-4 text-xl sm:text-2xl md:text-3xl font-semibold
          bg-section-header-bg text-section-header-text border-2 border-section-header-border 
          rounded-2xl shadow-section-header-shadow transition-all duration-300 ease-in-out 
          hover:bg-section-header-hover-bg hover:shadow-section-header-hover-shadow
          hover:scale-[1.02] hover:transform hover:-translate-y-1
          backdrop-blur-sm overflow-hidden
          !px-3 !py-3 !rounded-2xl !h-auto !min-h-0
        `,
				tab: `
          flex items-center px-4 py-2 transition-all text-sm sm:text-base md:text-lg
          font-medium border border-transparent hover:bg-navbar-button-hover-bg hover:text-navbar-button-hover-text hover:shadow-md hover:scale-[1.03] hover:transform hover:-translate-y-[2px] hover:border-navbar-button-hover-border
        `,
				"tab-active": `
          !bg-product-hover-background !text-navbar-button-active !border !border-product-primary shadow-sm font-semibold hover:scale-[1.03] hover:transform
        `,
				"sidebar-rail": `
          absolute inset-y-0 z-20 hidden w-4 -translate-x-1/2 transition-all ease-linear after:absolute after:inset-y-0 after:left-1/2 after:w-[2px] hover:after:bg-sidebar-border group-data-[side=left]:-right-4 group-data-[side=right]:left-0 sm:flex
          [[data-side=left]_&]:cursor-w-resize [[data-side=right]_&]:cursor-e-resize
          [[data-side=left][data-state=collapsed]_&]:cursor-e-resize [[data-side=right][data-state=collapsed]_&]:cursor-w-resize
          group-data-[collapsible=offcanvas]:translate-x-0 group-data-[collapsible=offcanvas]:after:left-full group-data-[collapsible=offcanvas]:hover:bg-sidebar
          [[data-side=left][data-collapsible=offcanvas]_&]:-right-2 [[data-side=right][data-collapsible=offcanvas]_&]:-left-2
        `,
				modal: `
          text-white bg-primaryColor font-medium text-sm inline-flex items-center px-5 py-2.5 text-center
        `,
				"file-action": `
          px-8 py-3 font-bold text-lg transition-all duration-300 ease-in-out
          focus:outline-none focus:ring-2 focus:ring-product-primary-accent focus:ring-opacity-50
        `,
				nav: `
          text-product-foreground text-sm font-medium px-3 py-2 h-9 transition-all duration-200 relative overflow-hidden
          hover:text-black hover:font-bold
          focus:ring-2 focus:ring-navbar-button-focus-ring focus:ring-offset-2
          border-0
          active:bg-product-hover-background active:text-navbar-button-active active:border-product-primary
          after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[3px] after:bg-product-primary
          after:content-[''] after:transition-transform after:duration-300 after:scale-x-0 after:origin-left
          hover:after:scale-x-100
        `,
				solution: `
          w-full group border border-product-primary bg-transparent text-product-primary font-lora font-semibold
          hover:bg-product-primary hover:text-product-background hover:scale-105
          transition-all duration-300 shadow-sm
        `,
			},
			size: {
				default: "h-9 px-4 py-2",
				sm: "h-8 px-3 text-xs",
				lg: "h-10 px-8",
				icon: "h-9 w-9",
			},
		},
		defaultVariants: {
			variant: "default",
			size: "default",
		},
	},
);

export interface ButtonProps
	extends React.ButtonHTMLAttributes<HTMLButtonElement>,
		VariantProps<typeof buttonVariants> {
	asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
	({ className, variant, size, asChild = false, ...props }, ref) => {
		const Comp = asChild ? Slot : "button";
		return (
			<Comp
				className={cn(buttonVariants({ variant, size, className }))}
				ref={ref}
				{...props}
			/>
		);
	},
);
Button.displayName = "Button";

export { Button, buttonVariants };
