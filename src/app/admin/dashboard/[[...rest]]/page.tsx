import type { AreLimitesReached, UserData } from "@quicktalog/common";
import Link from "next/link";

import { getUserData } from "@/actions/users";
import { CreateCatalogueProvider } from "@/components/catalogue/create/CreateCatalogueProvider";
import { Dashboard } from "@/components/dashboard/Dashboard";
import { FloatingActionMenu } from "@/components/dashboard/FloatingActionMenu";
import { AppShell } from "@/components/navigation/AppShell";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function page() {
	const userData: UserData = await getUserData();

	if (!userData) {
		return (
			<AppShell>
				<div className="flex min-h-[50vh] flex-col items-center justify-center gap-5 text-center">
					<p className="text-title-lg">
						Something went wrong. Please try again later.
					</p>
					<Button asChild size="lg">
						<Link href="/">Go to Home</Link>
					</Button>
				</div>
			</AppShell>
		);
	}

	const { currentPlan, usage, ...user } = userData;
	const areLimitesReached: AreLimitesReached = {
		catalogues:
			usage.catalogues >= currentPlan.features.catalogues ||
			usage.traffic.pageview_count >= currentPlan.features.traffic_limit,
		credits: usage.credits >= currentPlan.features.ai_credits,
	};

	return (
		<AppShell>
			<CreateCatalogueProvider>
				<Dashboard currentPlan={currentPlan} usage={usage} user={user} />
				<FloatingActionMenu areLimitsReached={areLimitesReached} />
			</CreateCatalogueProvider>
		</AppShell>
	);
}
