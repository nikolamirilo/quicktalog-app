import {
	DashboardTabButtons,
	type DashboardTabNavProps,
} from "@/components/dashboard/navigation/DashboardTabButtons";

/** Dashboard tab list for 720px and up; the mobile pill bar takes over below. */
export function DashboardSidebar({
	activeTab,
	onSelect,
}: DashboardTabNavProps) {
	return (
		<aside
			aria-label="Dashboard"
			className="sticky top-24 z-[1] hidden w-56 flex-none self-start rounded-product-card border border-product-border bg-product-card p-3 shadow-product md:block"
		>
			<nav aria-label="Dashboard tabs" className="flex flex-col gap-1.5">
				<DashboardTabButtons
					activeTab={activeTab}
					onSelect={onSelect}
					variant="sidebar"
				/>
			</nav>
		</aside>
	);
}
