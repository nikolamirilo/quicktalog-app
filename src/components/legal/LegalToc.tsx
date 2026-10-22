"use client";

import { ListOrdered } from "lucide-react";

import { Eyebrow } from "@/components/general/Eyebrow";
import { PageDisclosure } from "@/components/resources/PageDisclosure";
import { useScrollSpy } from "@/hooks/useScrollSpy";
import { cn } from "@/lib/ui/cn";

/** `label` carries its own number ("1. Definitions"), so the lists are `<ul>`. */
export type LegalTocItem = { id: string; label: string };

/**
 * "On this page" for a legal document: a disclosure on small screens and a
 * sticky list with a scroll-spy rail from `lg`.
 */
export function LegalToc({ items }: { items: LegalTocItem[] }) {
	const active = useScrollSpy(
		items.map((item) => item.id),
		130,
	);

	const link = (item: LegalTocItem, variant: "mobile" | "desktop") => {
		const isActive = item.id === active;
		return (
			<li key={item.id}>
				<a
					aria-current={isActive ? "location" : undefined}
					className={cn(
						variant === "mobile"
							? "block rounded-[10px] px-2.5 py-[9px] text-[14.5px] leading-[1.35] text-product-foreground-accent hover:bg-product-primary-soft hover:text-product-foreground"
							: "block border-l-2 py-1.5 pl-3.5 pr-3 text-sm leading-[1.4] transition-colors",
						variant === "mobile" &&
							isActive &&
							"bg-product-primary-soft text-product-foreground",
						variant === "desktop" &&
							(isActive
								? "border-product-primary bg-gradient-to-r from-product-primary-soft to-product-primary-soft/0 font-semibold text-product-foreground"
								: "border-product-border text-product-muted hover:border-product-border-strong hover:text-product-foreground"),
					)}
					href={`#${item.id}`}
				>
					{item.label}
				</a>
			</li>
		);
	};

	return (
		<aside className="min-w-0">
			<PageDisclosure
				className="lg:hidden"
				icon={<ListOrdered />}
				label="On this page"
			>
				<nav aria-label="On this page">
					<ul className="max-h-[55vh] overflow-auto pb-0.5">
						{items.map((item) => link(item, "mobile"))}
					</ul>
				</nav>
			</PageDisclosure>
			<nav
				aria-label="On this page"
				className="sticky top-[104px] hidden max-h-[calc(100vh-128px)] overflow-auto pb-2 lg:block"
			>
				<p className="mb-3 ml-3.5">
					<Eyebrow>On this page</Eyebrow>
				</p>
				<ul>{items.map((item) => link(item, "desktop"))}</ul>
			</nav>
		</aside>
	);
}
