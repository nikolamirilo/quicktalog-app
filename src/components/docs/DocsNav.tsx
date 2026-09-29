import { LifeBuoy } from "lucide-react";
import Link from "next/link";

import { getAllDocs } from "@/lib/content/docs";
import { cn } from "@/lib/ui/cn";

/**
 * The docs guide list: every topic with its icon, the current one marked with
 * `aria-current`. Server component, used in the sticky left rail on wide
 * screens and inside the "Browse all docs" disclosure on narrow ones.
 */
export function DocsNav({
	currentSlug,
	showHeading = true,
	showHelp = true,
}: {
	currentSlug?: string;
	showHeading?: boolean;
	showHelp?: boolean;
}) {
	const docs = getAllDocs();

	return (
		<nav aria-label="All docs">
			{showHeading && (
				<p className="mb-2 ml-2.5 text-xs font-bold uppercase tracking-[0.1em] text-product-muted">
					Guide
				</p>
			)}
			<ol className="grid gap-0.5">
				{docs.map((doc) => {
					const active = doc.meta.slug === currentSlug;
					const Icon = doc.meta.icon;

					return (
						<li key={doc.meta.slug}>
							<Link
								aria-current={active ? "page" : undefined}
								className={cn(
									"flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-[14.5px] leading-[1.3] transition-colors",
									active
										? "bg-product-primary-soft font-bold text-product-foreground ring-1 ring-inset ring-product-primary/55"
										: "font-medium text-product-foreground-accent hover:bg-product-background-hero hover:text-product-foreground",
								)}
								href={`/docs/${doc.meta.slug}`}
							>
								<span
									aria-hidden="true"
									className={cn(
										"grid h-7 w-7 flex-none place-items-center rounded-[9px] [&_svg]:h-3.5 [&_svg]:w-3.5",
										active
											? "bg-product-primary text-product-foreground"
											: "bg-product-background-hero text-product-muted",
									)}
								>
									<Icon />
								</span>
								<span>{doc.meta.title}</span>
							</Link>
						</li>
					);
				})}
			</ol>
			{showHelp && (
				<Link
					className="mt-3.5 flex items-center gap-2 rounded-[14px] border border-product-border bg-product-card p-3 text-[13.5px] font-semibold text-product-foreground-accent transition-colors hover:border-product-primary/60 hover:text-product-foreground"
					href="/help"
				>
					<LifeBuoy
						aria-hidden="true"
						className="h-4 w-4 text-product-primary-ink"
					/>
					Still stuck? Visit the Help Center
				</Link>
			)}
		</nav>
	);
}
