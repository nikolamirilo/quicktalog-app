import { ChevronDown } from "lucide-react";
import Link from "next/link";

import { ManualSearch } from "@/components/manual/ManualSearch";
import { manualPopularSlugs } from "@/content/manual/registry";
import {
	getManualNav,
	getManualSearchIndex,
	manualHref,
} from "@/lib/content/manual";
import { cn } from "@/lib/ui/cn";

/**
 * The module list. Only the module you are reading is open, so the whole manual
 * fits on screen without scrolling. Built from `details`, so it works before
 * JavaScript loads and keeps the sidebar a server component.
 */
export function ManualSidebar({
	currentSlug,
	showSearch = true,
}: {
	currentSlug?: string;
	showSearch?: boolean;
}) {
	const nav = getManualNav();
	const index = getManualSearchIndex();
	const popular = manualPopularSlugs
		.map((slug) => index.find((entry) => entry.slug === slug))
		.filter((entry): entry is (typeof index)[number] => Boolean(entry));

	const openGroupId =
		nav.find((entry) => entry.pages.some((page) => page.slug === currentSlug))
			?.group.id ?? nav[0]?.group.id;

	return (
		<div>
			{showSearch ? (
				<div className="mb-4">
					<ManualSearch index={index} popular={popular} />
				</div>
			) : null}
			<nav aria-label="Manual">
				<ul className="grid gap-1">
					{nav.map(({ group, pages }) => (
						<li key={group.id}>
							<details className="group" open={group.id === openGroupId}>
								<summary className="flex cursor-pointer list-none items-center gap-2 rounded-[10px] px-2.5 py-1.5 text-[11.5px] font-bold uppercase tracking-[0.04em] text-product-muted transition-colors hover:bg-product-background-hero hover:text-product-foreground-accent [&::-webkit-details-marker]:hidden">
									<group.icon aria-hidden="true" className="h-3.5 w-3.5" />
									{group.title}
									<span className="ml-auto rounded-full bg-product-background-hero px-1.5 text-[10px] font-bold tabular-nums group-open:hidden">
										{pages.length}
									</span>
									<ChevronDown
										aria-hidden="true"
										className="h-3.5 w-3.5 transition-transform group-open:rotate-180"
									/>
								</summary>
								<ul className="mt-1 grid gap-0.5 border-l border-product-border pl-2">
									{pages.map((page) => {
										const active = page.slug === currentSlug;
										return (
											<li key={page.slug}>
												<Link
													aria-current={active ? "page" : undefined}
													className={cn(
														"block rounded-[10px] px-2.5 py-[7px] text-[14px] leading-[1.35] transition-colors",
														active
															? "bg-product-primary-soft font-bold text-product-foreground"
															: "text-product-foreground-accent hover:bg-product-background-hero hover:text-product-foreground",
													)}
													href={manualHref(page.slug)}
												>
													{page.title}
												</Link>
											</li>
										);
									})}
								</ul>
							</details>
						</li>
					))}
				</ul>
			</nav>
		</div>
	);
}
