import { ChevronRight } from "lucide-react";
import Link from "next/link";

/** Docs › {title} breadcrumb shown above the topic hero. */
export function DocsBreadcrumbs({ title }: { title: string }) {
	return (
		<nav aria-label="Breadcrumb" className="mb-3.5">
			<ol className="flex flex-wrap items-center gap-1.5 text-sm text-product-muted">
				<li>
					<Link
						className="font-semibold text-product-foreground-accent transition-colors hover:text-product-primary-ink"
						href="/docs"
					>
						Docs
					</Link>
				</li>
				<li aria-hidden="true">
					<ChevronRight className="h-3.5 w-3.5" />
				</li>
				<li
					aria-current="page"
					className="font-semibold text-product-foreground"
				>
					{title}
				</li>
			</ol>
		</nav>
	);
}
