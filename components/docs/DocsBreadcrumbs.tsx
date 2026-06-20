import { ChevronRight } from "lucide-react";
import Link from "next/link";

/** Docs / {title} breadcrumb shown above the topic hero. */
export default function DocsBreadcrumbs({ title }: { title: string }) {
	return (
		<nav aria-label="Breadcrumb" className="mb-6">
			<ol className="flex min-w-0 items-center gap-1.5 text-sm text-product-foreground-accent">
				<li className="flex-shrink-0">
					<Link
						className="rounded transition-colors hover:text-product-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-product-primary"
						href="/docs"
					>
						Docs
					</Link>
				</li>
				<li aria-hidden className="flex-shrink-0 text-product-border">
					<ChevronRight className="h-3.5 w-3.5" />
				</li>
				<li
					aria-current="page"
					className="min-w-0 truncate font-medium text-product-foreground"
					title={title}
				>
					{title}
				</li>
			</ol>
		</nav>
	);
}
