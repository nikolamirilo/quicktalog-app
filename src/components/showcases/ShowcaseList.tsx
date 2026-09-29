"use client";

import { type KeyboardEvent, useLayoutEffect, useRef, useState } from "react";

import { VisitCatalogueLink } from "@/components/showcases/VisitCatalogueLink";
import type { ShowcaseItem } from "@/constants/marketing";
import { cn } from "@/lib/ui/cn";

/** Desktop sidebar: numbered catalogue list with a sliding amber indicator. */
export function ShowcaseList({
	items,
	activeIndex,
	onSelect,
}: {
	items: ShowcaseItem[];
	activeIndex: number;
	onSelect: (index: number) => void;
}) {
	const [indicator, setIndicator] = useState({ top: 0, height: 0 });
	const navRef = useRef<HTMLElement>(null);
	const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);

	// Measure the active item; re-measure when the list gets a size (it is
	// hidden below `lg`) so the indicator is right after a resize.
	useLayoutEffect(() => {
		const measure = () => {
			const item = itemRefs.current[activeIndex];
			if (item)
				setIndicator({ top: item.offsetTop, height: item.offsetHeight });
		};
		measure();
		const nav = navRef.current;
		if (!nav || typeof ResizeObserver === "undefined") return;
		const observer = new ResizeObserver(measure);
		observer.observe(nav);
		return () => observer.disconnect();
	}, [activeIndex]);

	const select = (index: number) => {
		const next = (index + items.length) % items.length;
		onSelect(next);
		itemRefs.current[next]?.focus();
	};

	const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
		const keys: Record<string, number> = {
			ArrowDown: activeIndex + 1,
			ArrowRight: activeIndex + 1,
			ArrowUp: activeIndex - 1,
			ArrowLeft: activeIndex - 1,
			Home: 0,
			End: items.length - 1,
		};
		if (!(event.key in keys)) return;
		event.preventDefault();
		select(keys[event.key]);
	};

	return (
		<aside
			aria-label="Catalogues"
			className="hidden w-[300px] flex-none flex-col overflow-hidden rounded-product-card border border-product-border bg-product-card shadow-product lg:flex"
		>
			<div className="border-b border-product-border px-[22px] pb-4 pt-[18px]">
				<p className="text-xs font-bold uppercase tracking-[0.14em] text-product-primary-ink">
					Catalogues
				</p>
				<p className="mt-0.5 text-[13.5px] text-product-muted">
					{items.length} live examples
				</p>
			</div>
			<nav
				aria-label="Catalogue list"
				className="relative min-h-0 flex-1 overflow-y-auto p-2 [scrollbar-width:none]"
				ref={navRef}
			>
				<span
					aria-hidden="true"
					className="pointer-events-none absolute left-2 top-0 z-[1] w-1 rounded-full bg-product-primary shadow-[0_0_0_3px_rgb(var(--product-primary-rgb)/0.18)] transition-[transform,height] duration-300 ease-[cubic-bezier(.3,.9,.3,1.1)]"
					style={{
						height: indicator.height,
						transform: `translateY(${indicator.top}px)`,
					}}
				/>
				<ol className="grid gap-0.5">
					{items.map((item, index) => {
						const isActive = index === activeIndex;
						return (
							<li key={item.src}>
								<button
									aria-current={isActive ? "true" : undefined}
									className={cn(
										"group relative flex w-full items-center gap-3 rounded-[14px] py-3 pl-4 pr-3.5 text-left text-[14.5px] font-semibold transition-colors focus-visible:outline-product-primary focus-visible:-outline-offset-[3px]",
										isActive
											? "bg-product-primary-soft text-product-foreground"
											: "text-product-foreground-accent hover:bg-product-background-hero hover:text-product-foreground",
									)}
									onClick={() => onSelect(index)}
									onKeyDown={onKeyDown}
									ref={(el) => {
										itemRefs.current[index] = el;
									}}
									tabIndex={isActive ? 0 : -1}
									type="button"
								>
									<span
										className={cn(
											"w-5 flex-none font-mono text-[11.5px] font-medium",
											isActive
												? "text-product-primary-ink"
												: "text-product-muted",
										)}
									>
										{String(index + 1).padStart(2, "0")}
									</span>
									<span className="min-w-0 flex-1 truncate">{item.title}</span>
									<span
										aria-hidden="true"
										className={cn(
											"h-[7px] w-[7px] flex-none rounded-full bg-product-primary transition-[opacity,transform]",
											isActive
												? "animate-pulse opacity-100"
												: "scale-[0.4] opacity-0",
										)}
									/>
								</button>
							</li>
						);
					})}
				</ol>
			</nav>
			<div className="border-t border-product-border p-4">
				<VisitCatalogueLink className="w-full" src={items[activeIndex].src} />
			</div>
		</aside>
	);
}
