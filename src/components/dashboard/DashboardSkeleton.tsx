/** Placeholder while a dashboard tab's data or code loads. */
export function TabSkeleton() {
	return (
		<div aria-busy="true" aria-label="Loading" className="space-y-4">
			<div className="h-8 w-56 animate-pulse rounded-full bg-product-background-hero" />
			<div className="h-40 animate-pulse rounded-product-card bg-product-background-hero" />
			<div className="h-64 animate-pulse rounded-product-card bg-product-background-hero" />
		</div>
	);
}

/**
 * The dashboard frame (sidebar and panel) with a loading tab inside. Shown by
 * the route's `loading.tsx` the moment the Dashboard link is clicked, and again
 * while the page streams its data, so the navbar never disappears.
 */
export function DashboardSkeleton() {
	return (
		<div className="flex items-start gap-6 lg:gap-7">
			<div
				aria-hidden="true"
				className="sticky top-24 hidden h-[268px] w-56 flex-none animate-pulse self-start rounded-product-card border border-product-border bg-product-card shadow-product md:block"
			/>
			<div className="relative z-[1] min-w-0 flex-1 rounded-product-panel border border-product-border bg-product-card/70 p-4 shadow-product md:p-7 lg:p-9">
				<TabSkeleton />
			</div>
		</div>
	);
}
