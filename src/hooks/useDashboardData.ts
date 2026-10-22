"use client";
import type { Catalogue, OverallAnalytics } from "@quicktalog/common";
import { useEffect } from "react";
import useSWR, { mutate } from "swr";

import type { DashboardOverview } from "@/lib/dashboard/overview";
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

/**
 * The overview's data. Nothing is fetched while another tab is open.
 *
 * `initial` is the overview the page already loaded on the server. It is shown
 * straight away and written into the SWR cache (replacing whatever an earlier
 * visit left there), so the browser does not ask the three routes again on
 * mount. Without it the hook fetches as before.
 */
export function useDashboardData(
	activeTab: string,
	initial?: DashboardOverview,
) {
	const shouldFetch = activeTab === "overview";
	const seeded = initial ? { revalidateOnMount: false } : {};

	useEffect(() => {
		if (!initial) return;
		mutate(KEYS.analytics, initial.analytics, { revalidate: false });
		mutate(KEYS.catalogues, initial.catalogues, { revalidate: false });
		mutate(KEYS.newsletter, initial.newsletter, { revalidate: false });
	}, [initial]);

	const analytics = useSWR<OverallAnalytics>(
		shouldFetch ? KEYS.analytics : null,
		fetcher,
		{
			...OPTIONS,
			...seeded,
			refreshInterval: 300000,
			fallbackData: initial?.analytics as OverallAnalytics | undefined,
		},
	);
	const catalogues = useSWR<Catalogue[]>(
		shouldFetch ? KEYS.catalogues : null,
		fetcher,
		{ ...OPTIONS, ...seeded, fallbackData: initial?.catalogues },
	);
	const newsletter = useSWR<NewsletterSubscriber[]>(
		shouldFetch ? KEYS.newsletter : null,
		fetcher,
		{ ...OPTIONS, ...seeded, fallbackData: initial?.newsletter },
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
