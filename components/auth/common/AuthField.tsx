import type { InputHTMLAttributes, ReactNode } from "react";
import { AUTH_FIELD } from "@/components/auth/common/authStyles";
import { cn } from "@/helpers/client";

/**
 * A labelled input. `action` is the optional link that sits opposite the label
 * — "Forgot password?" belongs beside the field it is about, not below the
 * form.
 */
export default function AuthField({
	action,
	className,
	id,
	label,
	...input
}: {
	action?: ReactNode;
	id: string;
	label: string;
} & InputHTMLAttributes<HTMLInputElement>) {
	return (
		<div className="space-y-1.5">
			<div className="flex items-baseline justify-between gap-3">
				<label
					className="text-sm font-medium text-product-foreground"
					htmlFor={id}
				>
					{label}
				</label>
				{action}
			</div>
			<input className={cn(AUTH_FIELD, className)} id={id} {...input} />
		</div>
	);
}
