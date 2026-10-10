"use client";
import { useRef } from "react";

import {
	DashboardTabButtons,
	type DashboardTabNavProps,
} from "@/components/dashboard/navigation/DashboardTabButtons";
import { useScrollActiveIntoView } from "@/hooks/useScrollActiveIntoView";
import { cn } from "@/lib/ui/cn";
import { pillTabBar } from "@/lib/ui/pill-tab";

/**
 * Horizontally scrollable pill tabs shown below 720px. The active pill is kept
 * centred so a tab picked off-screen (or opened by `?tab=`) stays visible.
 */
export function DashboardTabBar({
	activeTab,
	onSelect,
	disabled,
}: DashboardTabNavProps) {
	const listRef = useRef<HTMLElement>(null);
	useScrollActiveIntoView(listRef, '[aria-pressed="true"]', activeTab);

	return (
		<nav
			aria-label="Dashboard tabs"
			className={cn(
				pillTabBar,
				"-mx-4 -mt-1 mb-[18px] border-b border-product-border px-4 pb-2.5 pt-1 md:hidden",
			)}
			ref={listRef}
		>
			<DashboardTabButtons
				activeTab={activeTab}
				disabled={disabled}
				onSelect={onSelect}
				variant="bar"
			/>
		</nav>
	);
}
