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
          text-catalogue-button-text
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
          hover:bg-product-background-hover 
          hover:text-product-foreground-accent 
          transition-colors shadow-sm
        `,
        grayed: `
          bg-gray-200
          text-product-foreground
        `,
        secondary: `
          bg-product-background 
          text-product-foreground-accent 
          border border-product-border 
          hover:bg-product-background-hover 
          hover:text-product-background 
          shadow-sm
        `,
        ghost: `
          text-product-foreground 
          hover:bg-product-background-hover 
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
          hover:bg-product-background-hover 
          hover:text-product-foreground 
          hover:border-product-primary-accent 
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
          bg-product-background-hero hover:bg-product-primary text-product-foreground shadow-md hover:shadow-lg
        `,
        header: `
          text-black bg-product-primary hover:bg-product-primary-accent px-8 py-3 transition-colors
        `,
        "header-mobile": `
          text-black bg-product-primary hover:bg-product-primary-accent px-5 py-2 block w-fit
        `,
        contact: `
          group relative bg-product-primary hover:bg-product-primary-accent text-product-foreground px-12 py-4 font-semibold transition-all duration-300 transform hover:scale-product-scale-hover hover:shadow-product-shadow-hover disabled:opacity-30 disabled:cursor-not-allowed disabled:transform-none min-w-[200px]`,
        "section-header": `
          w-full group relative flex items-center justify-between 
          px-4 py-4 text-xl sm:text-2xl md:text-3xl font-semibold
          border-2 border-catalogue-category-border 
          rounded-2xl shadow-catalogue-category-shadow transition-all duration-300 ease-in-out 
          hover:scale-[1.02] hover:transform hover:-translate-y-1
          backdrop-blur-sm overflow-hidden
          !px-3 !py-3 !h-auto !min-h-0
        `,
        tab: `
          flex items-center px-4 py-2 transition-all text-sm sm:text-base md:text-lg
          font-medium border border-transparent hover:bg-product-nav-hover-bg hover:text-product-nav-hover-text hover:shadow-md hover:scale-[1.03] hover:transform hover:-translate-y-[2px] hover:border-product-nav-hover-border
        `,
        "tab-active": `
          !bg-product-background-hover !text-product-nav-active !border !border-product-primary shadow-sm font-semibold hover:scale-[1.03] hover:transform
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
          focus:ring-2 focus:ring-product-nav-focus-ring focus:ring-offset-2
          border-0
          active:bg-product-background-hover active:text-product-nav-active active:border-product-primary
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

const Button = React.forwardRef<
  HTMLButtonElement,
  ButtonProps & { locked?: boolean }
>(
  (
    { className, variant, size, asChild = false, locked, children, ...props },
    ref,
  ) => {
    const Comp = asChild ? Slot : "button";

    if (locked) {
      return (
        <Comp
          className={cn(
            buttonVariants({ variant, size, className }),
            "relative overflow-hidden",
          )}
          disabled
          ref={ref}
          {...props}
        >
          <div className="absolute inset-0 bg-gray-100/50 flex items-center justify-center z-10 backdrop-blur-[1px]">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="lucide lucide-lock w-4 h-4 text-gray-500"
            >
              <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </div>
          {children}
        </Comp>
      );
    }

    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      >
        {children}
      </Comp>
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };

