import { AUTH_CONTROL_HEIGHT } from "@/components/auth/common/authStyles";
import { Button, type ButtonProps } from "@/components/ui/button";
import { cn } from "@/helpers/client";

/**
 * A full-width auth control, sized to line up with the fields above it.
 *
 * `busy` both disables the button and swaps in `busyLabel`, so no caller has to
 * remember to do one without the other.
 */
export default function SubmitButton({
	busy = false,
	busyLabel,
	children,
	className,
	disabled,
	...props
}: ButtonProps & { busy?: boolean; busyLabel?: string }) {
	return (
		<Button
			className={cn(AUTH_CONTROL_HEIGHT, "w-full text-[0.9375rem]", className)}
			disabled={disabled || busy}
			{...props}
		>
			{busy && busyLabel ? busyLabel : children}
		</Button>
	);
}
