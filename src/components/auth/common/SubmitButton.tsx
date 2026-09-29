import { Button, type ButtonProps } from "@/components/ui/button";
import { cn } from "@/lib/ui/cn";

/**
 * A full-width auth button.
 *
 * `busy` disables the button, shows a spinner, sets `aria-busy` and swaps in
 * `busyLabel`, so no caller has to remember to do one without the others.
 */
export function SubmitButton({
	busy = false,
	busyLabel,
	children,
	className,
	disabled,
	...props
}: ButtonProps & { busy?: boolean; busyLabel?: string }) {
	return (
		<Button
			aria-busy={busy || undefined}
			className={cn(
				"h-[50px] w-full text-base",
				busy && "cursor-progress disabled:opacity-90",
				className,
			)}
			disabled={disabled || busy}
			{...props}
		>
			{busy ? (
				<span
					aria-hidden="true"
					className="size-[17px] animate-spin rounded-full border-[2.5px] border-product-foreground/25 border-t-product-foreground"
				/>
			) : null}
			{busy && busyLabel ? busyLabel : children}
		</Button>
	);
}
