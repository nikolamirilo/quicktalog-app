"use client";
import { useEffect, useRef } from "react";

import {
	DashboardTabButtons,
	type DashboardTabNavProps,
} from "@/components/dashboard/navigation/DashboardTabButtons";

/**
 * Horizontally scrollable pill tabs shown below 720px. The active pill is kept
 * centred so a tab picked off-screen (or opened by `?tab=`) stays visible.
 */
export function DashboardTabBar({ activeTab, onSelect }: DashboardTabNavProps) {
	const listRef = useRef<HTMLElement>(null);

	useEffect(() => {
		const list = listRef.current;
		const active = list?.querySelector<HTMLElement>('[aria-pressed="true"]');
		if (!list || !active) return;
		// scrollLeft, not scrollIntoView: that would also scroll the page.
		list.scrollTo({
			left: active.offsetLeft - (list.clientWidth - active.clientWidth) / 2,
			behavior: "smooth",
		});
	}, [activeTab]);

	return (
		<nav
			aria-label="Dashboard tabs"
			className="-mx-4 -mt-1 mb-[18px] flex gap-1.5 overflow-x-auto border-b border-product-border px-4 pb-2.5 pt-1 [scrollbar-width:none] md:hidden [&::-webkit-scrollbar]:hidden"
			ref={listRef}
		>
			<DashboardTabButtons
				activeTab={activeTab}
				onSelect={onSelect}
				variant="bar"
			/>
		</nav>
	);
}
