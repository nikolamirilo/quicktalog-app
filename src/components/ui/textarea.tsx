import * as React from "react";

import { cn } from "@/lib/ui/cn";

const Textarea = React.forwardRef<
	HTMLTextAreaElement,
	React.ComponentProps<"textarea">
>(({ className, ...props }, ref) => {
	return (
		<textarea
			className={cn(
				"flex min-h-[110px] w-full rounded-[14px] px-4 py-3 text-base md:text-[15px] leading-relaxed border-[1.5px] border-product-border-strong bg-product-card text-product-foreground transition-[border-color,box-shadow] placeholder:text-product-muted hover:border-product-border-hover focus-visible:outline-none focus-visible:border-product-primary focus-visible:ring-4 focus-visible:ring-product-primary/25 aria-[invalid=true]:border-product-error aria-[invalid=true]:ring-4 aria-[invalid=true]:ring-product-error/10 disabled:cursor-not-allowed disabled:opacity-50",
				className,
			)}
			ref={ref}
			{...props}
		/>
	);
});
Textarea.displayName = "Textarea";

export { Textarea };
