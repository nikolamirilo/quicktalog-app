import { AuthLayout } from "@/components/auth/common/AuthLayout";

/**
 * The auth shell with an empty card, in the prerendered HTML until the forms
 * (which read the query string) render in the browser.
 */
export function AuthSkeleton() {
	return (
		<AuthLayout>
			<div
				aria-busy="true"
				aria-label="Loading"
				className="h-[520px] w-full max-w-[460px] animate-pulse rounded-product-card border border-product-border bg-product-card shadow-product"
				role="status"
			/>
		</AuthLayout>
	);
}
