import { cn } from "@/helpers/client";

/**
 * The class strings every auth screen shares.
 *
 * Sizes are stated explicitly because `.product` sets an 18px base (`@apply
 * text-lg` in `styles/product.css`): a control that inherits it ends up far larger
 * than the `Button` next to it.
 */

/** One height for fields and buttons, so a form reads as a single column. */
export const AUTH_CONTROL_HEIGHT = "h-11";

/** Inline link styling shared by every auth screen. */
export const AUTH_LINK =
	"font-medium text-product-secondary underline-offset-4 hover:underline";

export const AUTH_FIELD = cn(
	AUTH_CONTROL_HEIGHT,
	"w-full rounded-lg border border-product-border bg-product-background px-3.5",
	"text-[0.9375rem] text-product-foreground placeholder:text-product-foreground-accent/50",
	"transition-colors duration-200 focus:border-product-primary focus:outline-none",
	"focus:ring-2 focus:ring-product-primary/25 disabled:cursor-not-allowed disabled:opacity-60",
);
