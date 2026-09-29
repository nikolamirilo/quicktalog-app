import { DashboardSkeleton } from "@/components/dashboard/DashboardSkeleton";
import { AppShell } from "@/components/navigation/AppShell";

/** Prefetched with the Dashboard link, so a click shows the frame at once. */
export default function Loading() {
	return (
		<AppShell>
			<DashboardSkeleton />
		</AppShell>
	);
}
