import { Button } from "@/components/ui/button";
import { tabs } from "@/constants/ui";

export default function MobileTabBar({ setActiveTab, activeTab }) {
	return (
		<nav className="mobile-tab-scroll md:hidden flex flex-row gap-2 overflow-x-auto py-2 px-1 bg-product-background/95 mb-4">
			{tabs.map((tab) => (
				<Button
					key={tab.value}
					onClick={() => setActiveTab(tab.value)}
					variant="nav"
					className={`${
						activeTab === tab.value
							? "!bg-product-hover-background !text-navbar-button-active !border !border-product-primary shadow-sm font-semibold hover:scale-[1.03] hover:transform"
							: ""
					} flex items-center justify-start font-body flex-shrink-0 whitespace-nowrap`}
					aria-current={activeTab === tab.value ? "page" : undefined}
				>
					<span className="flex items-center justify-center">{tab.icon}</span>
					{tab.label}
				</Button>
			))}
		</nav>
	);
}
