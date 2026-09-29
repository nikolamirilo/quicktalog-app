"use client";
import type { Catalogue, OverallAnalytics } from "@quicktalog/common";
import useSWR, { mutate } from "swr";

import type { NewsletterSubscriber } from "@/types/shared";

const KEYS = {
	analytics: "/api/dashboard/analytics",
	catalogues: "/api/dashboard/catalogues",
	newsletter: "/api/dashboard/newsletter",
} as const;

/** Thrown for a non-2xx answer, so SWR reports an error instead of storing the body. */
export class DashboardFetchError extends Error {
	constructor(
		readonly url: string,
		readonly status: number,
	) {
		super(`GET ${url} failed with ${status}`);
		this.name = "DashboardFetchError";
	}
}

async function fetcher<T>(url: string): Promise<T> {
	const res = await fetch(url);
	if (!res.ok) throw new DashboardFetchError(url, res.status);
	return res.json() as Promise<T>;
}

const OPTIONS = {
	revalidateOnFocus: false,
	revalidateOnReconnect: false,
	dedupingInterval: 60000,
};

/**
 * Re-fetches the overview's three lists by SWR key. Needs no hook instance, so
 * a catalogue card or the builder can call it without subscribing to the data.
 */
export async function refreshDashboardData(): Promise<void> {
	await Promise.all(Object.values(KEYS).map((key) => mutate(key)));
}

/** The overview's data. Nothing is fetched while another tab is open. */
export function useDashboardData(activeTab: string) {
	const shouldFetch = activeTab === "overview";

	const analytics = useSWR<OverallAnalytics>(
		shouldFetch ? KEYS.analytics : null,
		fetcher,
		{ ...OPTIONS, refreshInterval: 300000 },
	);
	const catalogues = useSWR<Catalogue[]>(
		shouldFetch ? KEYS.catalogues : null,
		fetcher,
		OPTIONS,
	);
	const newsletter = useSWR<NewsletterSubscriber[]>(
		shouldFetch ? KEYS.newsletter : null,
		fetcher,
		OPTIONS,
	);

	return {
		analytics: analytics.data,
		catalogues: Array.isArray(catalogues.data) ? catalogues.data : [],
		newsletterSubscribers: Array.isArray(newsletter.data)
			? newsletter.data
			: [],
		loadingStates: {
			analytics: analytics.isLoading,
			catalogues: catalogues.isLoading,
		},
		errors: {
			/** The overview cannot render without these two. */
			overview: analytics.error ?? catalogues.error,
			newsletter: newsletter.error,
		},
		refreshAll: refreshDashboardData,
	};
}
