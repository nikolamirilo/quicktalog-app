import Link from "next/link";
import type { ComponentProps } from "react";

import { cn } from "@/lib/ui/cn";

/** Ink text with the amber underline used for inline links across the product. */
export const textLinkClass =
	"font-semibold text-product-foreground underline decoration-product-primary/85 decoration-2 underline-offset-[3px] transition-colors hover:text-product-primary-ink";

export function TextLink({ className, ...props }: ComponentProps<typeof Link>) {
	return <Link className={cn(textLinkClass, className)} {...props} />;
}
