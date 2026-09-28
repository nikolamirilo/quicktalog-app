/** Separates the OAuth button from the email form. */
export default function AuthDivider() {
	return (
		<div className="my-5 flex items-center gap-3">
			<span className="h-px flex-1 bg-product-border" />
			<span className="text-xs font-medium uppercase tracking-wider text-product-foreground-accent/70">
				or
			</span>
			<span className="h-px flex-1 bg-product-border" />
		</div>
	);
}
