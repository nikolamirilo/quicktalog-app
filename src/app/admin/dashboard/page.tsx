import type { AreLimitesReached, UserData } from "@quicktalog/common";
import Link from "next/link";
import { Suspense } from "react";

import { getUserData } from "@/actions/users";
import { CreateCatalogueProvider } from "@/components/catalogue/create/CreateCatalogueProvider";
import { Dashboard } from "@/components/dashboard/Dashboard";
import { DashboardSkeleton } from "@/components/dashboard/DashboardSkeleton";
import { FloatingActionMenu } from "@/components/dashboard/FloatingActionMenu";
import { AppShell } from "@/components/navigation/AppShell";
import { Button } from "@/components/ui/button";
import { toDashboardTab } from "@/constants/dashboard";
import { getVerifiedIdentity } from "@/lib/auth/identity";
import { loadDashboardOverview } from "@/lib/dashboard/overview";

export const dynamic = "force-dynamic";

type PageProps = {
	searchParams: Promise<Record<string, string | string[] | undefined>>;
};

/**
 * The frame renders at once and the data streams in behind a skeleton, so the
 * navbar and dashboard frame stay on screen while the database answers.
 */
export default function page(props: PageProps) {
	return (
		<AppShell>
			<Suspense fallback={<DashboardSkeleton />}>
				<DashboardContent {...props} />
			</Suspense>
		</AppShell>
	);
}

async function DashboardContent({ searchParams }: PageProps) {
	const query = await searchParams;
	const tab = typeof query.tab === "string" ? query.tab : null;
	const me = await getVerifiedIdentity();

	// Two independent transactions side by side: the profile/plan/usage and, when
	// the overview is the tab being opened, its lists. The browser would
	// otherwise ask for the lists only after hydrating, a second round of
	// cross-region queries after the first.
	const [userData, initialOverview]: [
		UserData,
		Awaited<ReturnType<typeof loadDashboardOverview>>,
	] = await Promise.all([
		getUserData(),
		me && toDashboardTab(tab) === "overview"
			? loadDashboardOverview(me)
			: undefined,
	]);

	if (!userData) {
		return (
			<div className="flex min-h-[50vh] flex-col items-center justify-center gap-5 text-center">
				<p className="text-title-lg">
					Something went wrong. Please try again later.
				</p>
				<Button asChild size="lg">
					<Link href="/">Go to Home</Link>
				</Button>
			</div>
		);
	}

	const { currentPlan, usage, ...user } = userData;
	const areLimitesReached: AreLimitesReached = {
		catalogues:
			usage.catalogues >= currentPlan.features.catalogues ||
			usage.traffic.pageviews >= currentPlan.features.traffic_limit,
		credits: usage.credits >= currentPlan.features.ai_credits,
	};

	return (
		<CreateCatalogueProvider>
			<Dashboard
				currentPlan={currentPlan}
				initialOverview={initialOverview}
				usage={usage}
				user={user}
			/>
			<FloatingActionMenu areLimitsReached={areLimitesReached} />
		</CreateCatalogueProvider>
	);
}
