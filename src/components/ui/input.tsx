import * as React from "react";

import { cn } from "@/lib/ui/cn";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
	({ className, type, ...props }, ref) => {
		return (
			<input
				className={cn(
					"flex h-11 w-full rounded-[14px] px-4 text-base md:text-[15px] border-[1.5px] border-product-border-strong bg-product-card text-product-foreground transition-[border-color,box-shadow] placeholder:text-product-muted hover:border-product-border-hover focus-visible:outline-none focus-visible:border-product-primary focus-visible:ring-4 focus-visible:ring-product-primary/25 aria-[invalid=true]:border-product-error aria-[invalid=true]:ring-4 aria-[invalid=true]:ring-product-error/10 disabled:cursor-not-allowed disabled:opacity-50 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-product-foreground",
					className,
				)}
				ref={ref}
				type={type}
				{...props}
			/>
		);
	},
);
Input.displayName = "Input";

export { Input };
