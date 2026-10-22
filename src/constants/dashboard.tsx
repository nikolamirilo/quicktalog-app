import {
	CalendarDays,
	ChartColumn,
	CircleHelp,
	FileChartColumn,
	Settings,
} from "lucide-react";

/** Dashboard tabs, in sidebar order. `value` is the `?tab=` query value. */
export const DASHBOARD_TABS = [
	{ value: "overview", label: "Overview", icon: <FileChartColumn /> },
	{ value: "subscription", label: "Subscription", icon: <CalendarDays /> },
	{ value: "usage", label: "Usage", icon: <ChartColumn /> },
	{ value: "settings", label: "Settings", icon: <Settings /> },
	{ value: "support", label: "Support", icon: <CircleHelp /> },
] as const;

export type DashboardTab = (typeof DASHBOARD_TABS)[number]["value"];

export const DASHBOARD_PATH = "/admin/dashboard";

/** Any `?tab=` value that is not a known tab opens the overview. */
export function toDashboardTab(value: string | null): DashboardTab {
	return DASHBOARD_TABS.some((tab) => tab.value === value)
		? (value as DashboardTab)
		: "overview";
}

/**
 * The tab a dashboard URL opens. Below `/admin/dashboard/` Clerk's
 * `<UserProfile/>` routes its own pages without a `?tab=`; those belong to
 * the settings tab.
 */
export function dashboardTabFromUrl(
	tabParam: string | null,
	pathname: string,
): DashboardTab {
	if (tabParam === null && isAccountSubRoute(pathname)) return "settings";
	return toDashboardTab(tabParam);
}

export function isAccountSubRoute(pathname: string) {
	return pathname.startsWith(`${DASHBOARD_PATH}/`);
}
