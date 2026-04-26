import type { OverallAnalytics } from "@quicktalog/common";
import { Catalogue } from "@quicktalog/common";
import useSWR from "swr";
import type { NewsletterSubscriber } from "@/types/shared";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

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

export function useNewsletter(shouldFetch: boolean) {
	const { data, error, isLoading, mutate } = useSWR(
		shouldFetch ? "/api/dashboard/newsletter" : null,
		fetcher,
		{
			revalidateOnFocus: false,
			revalidateOnReconnect: false,
			dedupingInterval: 60000,
		},
	);

	return {
		newsletterSubscribers: (data || []) as NewsletterSubscriber[],
		loading: isLoading,
		error,
		refresh: mutate,
	};
}

export function useDashboardData(activeTab: string) {
	const shouldFetchOverviewData = activeTab === "overview";

	const analyticsData = useAnalytics(shouldFetchOverviewData);
	const cataloguesData = useCatalogues(shouldFetchOverviewData);
	const newsletterData = useNewsletter(shouldFetchOverviewData);

	const refreshAll = async () => {
		await Promise.all([
			analyticsData.refresh(),
			cataloguesData.refresh(),
			newsletterData.refresh(),
		]);
	};

	return {
		analytics: analyticsData.analytics,
		catalogues: cataloguesData.catalogues,
		newsletterSubscribers: newsletterData.newsletterSubscribers,
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
		refreshNewsletter: newsletterData.refresh,
	};
}
