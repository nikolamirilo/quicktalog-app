/** Separates the Google button from the email form. */
export function AuthDivider() {
	return (
		<div className="my-5 flex items-center gap-3.5 text-[13px] font-semibold uppercase tracking-[0.08em] text-product-muted">
			<span aria-hidden="true" className="h-px flex-1 bg-product-border" />
			<span>or</span>
			<span aria-hidden="true" className="h-px flex-1 bg-product-border" />
		</div>
	);
}
