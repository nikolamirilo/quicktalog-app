import { Button } from "@/components/ui/button";
import { tabs } from "@/constants/ui";

export default function SidebarContent({
	setActiveTab,
	activeTab,
	getSidebarButtonClass,
}) {
	return (
		<aside className="hidden md:block w-56 flex-shrink-0 bg-product-background/90 border border-product-border shadow-md rounded-2xl sticky top-24 self-start">
			<nav className="p-4 flex md:flex-col flex-row gap-2 md:gap-3">
				{tabs.map((tab) => (
					<Button
						key={tab.value}
						onClick={() => setActiveTab(tab.value)}
						variant="nav"
						className={`${getSidebarButtonClass(activeTab === tab.value)} flex items-center justify-start`}
						aria-current={activeTab === tab.value ? "page" : undefined}
					>
						<span className="flex items-center justify-center">{tab.icon}</span>
						{tab.label}
					</Button>
				))}
			</nav>
		</aside>
	);
}
