import { DASHBOARD_TABS, type DashboardTab } from "@/constants/dashboard";
import { cn } from "@/lib/ui/cn";
import { pillTab } from "@/lib/ui/pill-tab";

export type DashboardTabNavProps = {
	activeTab: DashboardTab;
	onSelect: (tab: DashboardTab) => void;
	/** While the dashboard data loads the tabs show but cannot be picked. */
	disabled?: boolean;
};

const VARIANTS = {
	/** Stacked rows in the sidebar card (720px and up). */
	sidebar: {
		base: "flex h-[46px] items-center gap-3 rounded-[14px] border border-transparent px-3.5 text-left text-[15px] font-medium text-product-foreground-accent transition-[background-color,color,transform,border-color] duration-150 hover:bg-product-background-hero hover:text-product-foreground [&_svg]:size-[19px] [&_svg]:flex-none",
		active:
			"border-product-primary bg-product-primary-soft font-bold text-product-foreground shadow-[0_1px_2px_rgb(var(--product-foreground-rgb)/0.06)] hover:scale-[1.03] hover:bg-product-primary-soft [&_svg]:text-product-primary-ink",
	},
	/** Pills in the scrollable bar (below 720px). */
	bar: pillTab,
};

/**
 * One button per dashboard tab. The tabs switch content in place rather than
 * navigating, so the active one is `aria-pressed`, not `aria-current`.
 */
export function DashboardTabButtons({
	activeTab,
	onSelect,
	disabled,
	variant,
}: DashboardTabNavProps & { variant: keyof typeof VARIANTS }) {
	const styles = VARIANTS[variant];
	return (
		<>
			{DASHBOARD_TABS.map((tab) => {
				const isActive = activeTab === tab.value;
				return (
					<button
						aria-pressed={isActive}
						className={cn(
							styles.base,
							isActive && styles.active,
							"disabled:pointer-events-none",
						)}
						disabled={disabled}
						key={tab.value}
						onClick={() => onSelect(tab.value)}
						type="button"
					>
						{tab.icon}
						{tab.label}
					</button>
				);
			})}
		</>
	);
}
