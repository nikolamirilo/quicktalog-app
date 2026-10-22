"use client";

import { PasswordMeter } from "@/components/auth/common/PasswordMeter";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/ui/cn";
import { Eye, EyeOff } from "lucide-react";
import {
	type InputHTMLAttributes,
	type ReactNode,
	type Ref,
	useState,
} from "react";

/**
 * A labelled input. `action` is the optional link that sits opposite the label
 * - "Forgot password?" belongs beside the field it is about, not below the
 * form. Password fields get a show/hide toggle; `meter` adds the strength bars
 * under them, which are a visual aid only and never block a submit.
 */
export function AuthField({
	action,
	className,
	hint,
	id,
	inputRef,
	label,
	meter = false,
	type,
	value,
	...input
}: {
	action?: ReactNode;
	/** Help text under the field. With `meter`, it shows until the user types. */
	hint?: string;
	id: string;
	/** For callers that move focus back to the field. */
	inputRef?: Ref<HTMLInputElement>;
	label: string;
	meter?: boolean;
} & InputHTMLAttributes<HTMLInputElement>) {
	const [shown, setShown] = useState(false);
	const isPassword = type === "password";
	const hintId = hint || meter ? `${id}-hint` : undefined;

	return (
		<div className="min-w-0">
			<div className="mb-[7px] flex items-baseline justify-between gap-3">
				<Label className="text-sm leading-normal" htmlFor={id}>
					{label}
				</Label>
				{action}
			</div>
			<div className="relative">
				<Input
					aria-describedby={hintId}
					className={cn("h-12 text-base", isPassword && "pr-[52px]", className)}
					id={id}
					ref={inputRef}
					type={isPassword && shown ? "text" : type}
					value={value}
					{...input}
				/>
				{isPassword ? (
					<button
						aria-controls={id}
						aria-label="Show password"
						aria-pressed={shown}
						className="absolute right-1 top-1 grid size-10 place-items-center rounded-full text-product-muted transition-colors hover:bg-product-background-hero hover:text-product-foreground [&_svg]:size-[19px]"
						onClick={() => setShown((current) => !current)}
						type="button"
					>
						{shown ? <EyeOff /> : <Eye />}
					</button>
				) : null}
			</div>
			{meter && hintId ? (
				<PasswordMeter
					hint={hint}
					id={hintId}
					password={typeof value === "string" ? value : ""}
				/>
			) : hintId ? (
				<p className="mt-[7px] text-[13px] text-product-muted" id={hintId}>
					{hint}
				</p>
			) : null}
		</div>
	);
}
