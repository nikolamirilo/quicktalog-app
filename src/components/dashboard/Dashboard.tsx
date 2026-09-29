"use client";
import type { PricingPlan, Usage, User } from "@quicktalog/common";
import { usePathname, useSearchParams } from "next/navigation";
import { lazy, Suspense, useEffect, useState } from "react";

import { DashboardSidebar } from "@/components/dashboard/navigation/DashboardSidebar";
import { DashboardTabBar } from "@/components/dashboard/navigation/DashboardTabBar";
import { Overview } from "@/components/dashboard/Overview";
import { Button } from "@/components/ui/button";
import {
	DASHBOARD_PATH,
	type DashboardTab,
	toDashboardTab,
} from "@/constants/dashboard";
import { useDashboardData } from "@/hooks/useDashboardData";

const Subscription = lazy(() =>
	import("@/components/dashboard/Subscription").then((m) => ({
		default: m.Subscription,
	})),
);
const MonthlyUsage = lazy(() =>
	import("@/components/dashboard/MonthlyUsage").then((m) => ({
		default: m.MonthlyUsage,
	})),
);
const Settings = lazy(() =>
	import("@/components/dashboard/Settings").then((m) => ({
		default: m.Settings,
	})),
);
const Support = lazy(() =>
	import("@/components/dashboard/Support").then((m) => ({
		default: m.Support,
	})),
);

type DashboardProps = {
	user: User;
	usage: Usage;
	currentPlan: PricingPlan;
};

/** Placeholder while a tab's data or code loads. */
function TabSkeleton() {
	return (
		<div aria-busy="true" aria-label="Loading" className="space-y-4">
			<div className="h-8 w-56 animate-pulse rounded-full bg-product-background-hero" />
			<div className="h-40 animate-pulse rounded-product-card bg-product-background-hero" />
			<div className="h-64 animate-pulse rounded-product-card bg-product-background-hero" />
		</div>
	);
}

function OverviewError({ onRetry }: { onRetry: () => void }) {
	return (
		<div
			className="flex flex-col items-center gap-4 rounded-product-card border border-product-border bg-product-card px-6 py-12 text-center"
			role="alert"
		>
			<p className="text-[15px] text-product-foreground-accent">
				We couldn't load your dashboard. Please try again.
			</p>
			<Button onClick={onRetry} size="sm" variant="outline">
				Try again
			</Button>
		</div>
	);
}

/**
 * Below `/admin/dashboard/` Clerk's `<UserProfile/>` routes its own pages
 * (e.g. `/admin/dashboard/security`) without a `?tab=`; those belong to the
 * settings tab.
 */
function isAccountSubRoute(pathname: string) {
	return pathname.startsWith(`${DASHBOARD_PATH}/`);
}

export function Dashboard({ user, usage, currentPlan }: DashboardProps) {
	// `?tab=settings` lets the account menu (and a bookmark) open a tab
	// directly; anything unknown falls back to the overview.
	const searchParams = useSearchParams();
	const pathname = usePathname();
	const tabParam = searchParams.get("tab");
	const onSubRoute = isAccountSubRoute(pathname);
	const [activeTab, setActiveTab] = useState<DashboardTab>(() =>
		tabParam === null && onSubRoute ? "settings" : toDashboardTab(tabParam),
	);

	// A link to `?tab=` while the dashboard is already open (the account menu)
	// changes the URL without remounting; follow it. A URL without `?tab=` on a
	// Clerk sub-route is Clerk navigating inside Settings, not a tab change.
	useEffect(() => {
		if (tabParam === null && onSubRoute) return;
		setActiveTab(toDashboardTab(tabParam));
	}, [tabParam, onSubRoute]);

	const selectTab = (tab: DashboardTab) => {
		setActiveTab(tab);
		// The History API rather than router.replace: Next keeps
		// useSearchParams in sync with it, and it skips a server round trip
		// (this page is force-dynamic) just to switch a client-side tab.
		// Other query params and the hash are kept.
		const url = new URL(window.location.href);
		if (tab === "overview") url.searchParams.delete("tab");
		else url.searchParams.set("tab", tab);
		window.history.replaceState(
			null,
			"",
			`${url.pathname}${url.search}${url.hash}`,
		);
	};

	const {
		analytics,
		catalogues,
		newsletterSubscribers,
		loadingStates,
		errors,
		refreshAll,
	} = useDashboardData(activeTab);

	const renderOverview = () => {
		if (errors.overview) return <OverviewError onRetry={refreshAll} />;
		if (loadingStates.analytics || loadingStates.catalogues || !analytics) {
			return <TabSkeleton />;
		}
		return (
			<Overview
				catalogues={catalogues}
				currentPlan={currentPlan}
				newsletterError={Boolean(errors.newsletter)}
				newsletterSubscribers={newsletterSubscribers}
				overallAnalytics={{
					...analytics,
					totalServiceCatalogues: catalogues.length,
				}}
				refreshAll={refreshAll}
				usage={usage}
				user={user}
			/>
		);
	};

	return (
		<div className="flex items-start gap-6 lg:gap-7">
			<DashboardSidebar activeTab={activeTab} onSelect={selectTab} />

			<div className="relative z-[1] min-w-0 flex-1 rounded-product-panel border border-product-border bg-product-card/70 p-4 shadow-product md:p-7 lg:p-9">
				<DashboardTabBar activeTab={activeTab} onSelect={selectTab} />

				{activeTab === "overview" && renderOverview()}

				<Suspense fallback={<TabSkeleton />}>
					{activeTab === "subscription" && (
						<Subscription currentPlan={currentPlan} />
					)}
					{activeTab === "usage" && (
						<MonthlyUsage currentPlan={currentPlan} usage={usage} />
					)}
					{activeTab === "settings" && <Settings />}
					{activeTab === "support" && <Support />}
				</Suspense>
			</div>
		</div>
	);
}
