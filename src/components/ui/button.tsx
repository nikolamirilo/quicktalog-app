import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";

import { cn } from "@/lib/ui/cn";

const buttonVariants = cva(
	"inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full border-[1.5px] border-transparent font-semibold leading-none transition-[transform,box-shadow,background-color,color,border-color] duration-200 active:scale-[0.98] focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-[3px] focus-visible:outline-product-secondary disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-[1.1em] [&_svg]:shrink-0",
	{
		variants: {
			variant: {
				default:
					"bg-product-primary text-product-foreground shadow-product-primary hover:-translate-y-0.5 hover:bg-product-primary-accent hover:shadow-[0_10px_24px_-8px_rgba(245,163,0,0.65)]",
				outline:
					"border-product-primary bg-product-card text-product-foreground hover:-translate-y-0.5 hover:bg-product-primary-soft",
				secondary:
					"border-product-secondary/20 bg-product-card text-product-secondary hover:-translate-y-0.5 hover:border-product-secondary hover:bg-product-secondary-soft",
				ghost:
					"text-product-foreground-accent hover:bg-product-background-hero hover:text-product-foreground",
				destructive:
					"bg-product-error text-white hover:-translate-y-0.5 hover:brightness-95",
				link: "h-auto rounded-none px-0 text-product-foreground underline decoration-product-primary decoration-2 underline-offset-4 hover:text-product-primary-ink",
				inverse:
					"border-white/85 bg-transparent text-white hover:-translate-y-0.5 hover:bg-white hover:text-product-foreground",
			},
			size: {
				sm: "h-9 px-4 text-sm",
				default: "h-11 px-[22px] text-[15px]",
				lg: "h-14 px-8 text-[17px]",
				icon: "h-10 w-10 p-0",
			},
		},
		compoundVariants: [{ variant: "link", className: "h-auto px-0" }],
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
					<div className="absolute inset-0 bg-product-background-hero/60 flex items-center justify-center z-10 backdrop-blur-[1px]">
						<svg
							className="lucide lucide-lock w-4 h-4 text-product-muted"
							fill="none"
							height="16"
							stroke="currentColor"
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth="2"
							viewBox="0 0 24 24"
							width="16"
							xmlns="http://www.w3.org/2000/svg"
						>
							<rect height="11" rx="2" ry="2" width="18" x="3" y="11" />
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
