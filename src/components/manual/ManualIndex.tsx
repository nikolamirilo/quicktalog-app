import Link from "next/link";

import { getManualNav, manualHref } from "@/lib/content/manual";

/** Every page in the manual, grouped by module, so nothing is more than one tap away. */
export function ManualIndex() {
	const nav = getManualNav();

	return (
		<div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
			{nav.map(({ group, pages }) => (
				<div key={group.id}>
					<p className="flex items-center gap-2 text-[11.5px] font-bold uppercase tracking-[0.04em] text-product-muted">
						<group.icon aria-hidden="true" className="h-3.5 w-3.5" />
						{group.title}
					</p>
					<ul className="mt-2 grid gap-1 border-l border-product-border pl-3">
						{pages.map((page) => (
							<li key={page.slug}>
								<Link
									className="block text-[14.5px] leading-[1.45] text-product-foreground-accent transition-colors hover:text-product-primary-ink"
									href={manualHref(page.slug)}
								>
									{page.title}
								</Link>
							</li>
						))}
					</ul>
				</div>
			))}
		</div>
	);
}
