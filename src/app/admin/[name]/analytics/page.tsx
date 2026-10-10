import * as Sentry from "@sentry/nextjs";
import { notFound } from "next/navigation";
import { CatalogueAnalytics } from "@/components/analytics/CatalogueAnalytics";
import { AppShell } from "@/components/navigation/AppShell";
import { fetchCatalogueTraffic } from "@/lib/analytics/catalogue-traffic";
import {
	type CatalogueTraffic,
	parseTrafficRange,
} from "@/lib/analytics/traffic";
import { requireUser } from "@/lib/auth/session";
import { listOwnedCatalogues, ownsCatalogue } from "@/lib/catalogue/ownership";
import { withUser } from "@/utils/db";

type Props = {
	params: Promise<{ name: string }>;
	searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export const dynamic = "force-dynamic";

export default async function page({ params, searchParams }: Props) {
	const { name } = await params;
	// Only 7, 30 or 90; anything else falls back to 30.
	const range = parseTrafficRange((await searchParams).range);
	const me = await requireUser(`/admin/${name}/analytics`);

	// Only the catalogue's owner may see its visitors. The switcher list is
	// read in the same transaction; PostHog is called after it closes.
	const catalogues = await withUser(me, async (tx) =>
		(await ownsCatalogue(tx, me, name)) ? listOwnedCatalogues(tx, me) : null,
	);
	if (!catalogues) {
		notFound();
	}

	let traffic: CatalogueTraffic | null = null;
	try {
		traffic = await fetchCatalogueTraffic(name, range);
	} catch (err) {
		Sentry.captureException(err, { tags: { area: "analytics-page" } });
		console.error("Analytics page error:", err);
	}

	return (
		<AppShell footer={false}>
			<CatalogueAnalytics
				catalogue={name}
				catalogues={catalogues}
				range={range}
				traffic={traffic}
			/>
		</AppShell>
	);
}
