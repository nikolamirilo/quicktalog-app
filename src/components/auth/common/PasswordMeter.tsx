import { cn } from "@/lib/ui/cn";

const LABELS = ["", "Too weak", "Fair", "Good", "Strong"] as const;
const COLOURS = [
	"",
	"bg-product-error",
	"bg-product-warning",
	"bg-product-primary",
	"bg-product-success-bright",
] as const;

/**
 * A rough 0–4 score for the meter. It is guidance only: the real rule is the
 * field's `minLength` and GoTrue's own password policy.
 */
export function passwordStrength(password: string): number {
	if (!password) return 0;
	if (password.length < 8) return 1;
	let score = 1;
	if (password.length >= 12) score++;
	if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
	if (/\d|[^A-Za-z0-9]/.test(password)) score++;
	return Math.min(4, score);
}

/** Four bars and a spoken label under a new-password field. */
export function PasswordMeter({
	hint,
	id,
	password,
}: {
	hint?: string;
	/** The id the input points at with `aria-describedby`. */
	id: string;
	password: string;
}) {
	const level = passwordStrength(password);
	const text = level
		? `Strength: ${LABELS[level]}${level < 3 ? ". Try a longer password with numbers or symbols." : "."}`
		: hint;

	return (
		<>
			<div aria-hidden="true" className="mt-2.5 grid grid-cols-4 gap-1.5">
				{[1, 2, 3, 4].map((bar) => (
					<span
						className={cn(
							"h-[5px] rounded-full transition-colors duration-200",
							level >= bar ? COLOURS[level] : "bg-product-border",
						)}
						key={bar}
					/>
				))}
			</div>
			<p
				aria-live="polite"
				className="mt-[7px] text-[13px] text-product-muted"
				id={id}
			>
				{text}
			</p>
		</>
	);
}
