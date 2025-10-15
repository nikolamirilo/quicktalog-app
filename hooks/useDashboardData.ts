import useSWR from "swr";
import type { Catalogue, OverallAnalytics } from "@/types";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

// Individual hooks with SWR for better caching and revalidation
export function useAnalytics(shouldFetch: boolean) {
	const { data, error, isLoading, mutate } = useSWR(
		shouldFetch ? "/api/dashboard/analytics" : null,
		fetcher,
		{
			revalidateOnFocus: false,
			revalidateOnReconnect: false,
			dedupingInterval: 60000,
			refreshInterval: 300000,
		},
	);

	return {
		analytics: data as OverallAnalytics | undefined,
		loading: isLoading,
		error,
		refresh: mutate,
	};
}

export function useCatalogues(shouldFetch: boolean) {
	const { data, error, isLoading, mutate } = useSWR(
		shouldFetch ? "/api/dashboard/catalogues" : null,
		fetcher,
		{
			revalidateOnFocus: false,
			revalidateOnReconnect: false,
			dedupingInterval: 60000,
		},
	);

	return {
		catalogues: (data || []) as Catalogue[],
		loading: isLoading,
		error,
		refresh: mutate,
	};
}

// Combined hook for dashboard
export function useDashboardData(activeTab: string) {
	const shouldFetchOverviewData = activeTab === "overview";

	const analyticsData = useAnalytics(shouldFetchOverviewData);
	const cataloguesData = useCatalogues(shouldFetchOverviewData);

	// Manual refresh function that refreshes both
	const refreshAll = async () => {
		await Promise.all([analyticsData.refresh(), cataloguesData.refresh()]);
	};

	return {
		analytics: analyticsData.analytics,
		catalogues: cataloguesData.catalogues,
		loadingStates: {
			analytics: analyticsData.loading,
			catalogues: cataloguesData.loading,
		},
		errors: {
			analytics: analyticsData.error,
			catalogues: cataloguesData.error,
		},
		refreshAll,
		refreshAnalytics: analyticsData.refresh,
		refreshCatalogues: cataloguesData.refresh,
	};
}
