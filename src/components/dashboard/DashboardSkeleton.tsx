"use client";
import { usePathname, useSearchParams } from "next/navigation";

import { DashboardSidebar } from "@/components/dashboard/navigation/DashboardSidebar";
import { DashboardTabBar } from "@/components/dashboard/navigation/DashboardTabBar";
import { dashboardTabFromUrl } from "@/constants/dashboard";

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

const noop = () => {};

/**
 * The dashboard frame with a loading tab inside. Shown by the route's
 * `loading.tsx` the moment the Dashboard link is clicked, and again while the
 * page streams its data, so the navbar and tab list never disappear; the tabs
 * are disabled until the dashboard mounts.
 */
export function DashboardSkeleton() {
	const activeTab = dashboardTabFromUrl(
		useSearchParams().get("tab"),
		usePathname(),
	);
	return (
		<div className="flex items-start gap-6 lg:gap-7">
			<DashboardSidebar activeTab={activeTab} disabled onSelect={noop} />
			<div className="relative z-[1] min-w-0 flex-1 rounded-product-panel border border-product-border bg-product-card/70 p-4 shadow-product md:p-7 lg:p-9">
				<DashboardTabBar activeTab={activeTab} disabled onSelect={noop} />
				<TabSkeleton />
			</div>
		</div>
	);
}
