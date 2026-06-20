import Link from "next/link";
import { getAllDocs } from "@/helpers/docs";

/**
 * Persistent docs navigation, rendered in the left sidebar on the index and
 * topic pages and inside a disclosure on mobile. Server component: it reads the
 * docs registry directly and highlights the active topic from `currentSlug`,
 * so no client JS is needed for the active state.
 */
export default function DocsNav({
	currentSlug,
	label = "Documentation",
}: {
	currentSlug?: string;
	label?: string;
}) {
	const docs = getAllDocs();

	return (
		<nav aria-label={label}>
			<p className="mb-3 px-3 text-xs font-semibold uppercase tracking-[0.2em] text-product-secondary">
				Guide
			</p>
			<ul className="space-y-0.5">
				{docs.map((doc) => {
					const active = doc.meta.slug === currentSlug;
					const Icon = doc.meta.icon;

					return (
						<li key={doc.meta.slug}>
							<Link
								aria-current={active ? "page" : undefined}
								className={`group flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm leading-snug transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-product-primary ${
									active
										? "bg-product-background-hover font-semibold text-product-foreground"
										: "text-product-foreground-accent hover:bg-product-background-hover hover:text-product-foreground"
								}`}
								href={`/docs/${doc.meta.slug}`}
							>
								<Icon
									aria-hidden
									className={`h-4 w-4 flex-shrink-0 transition-colors ${
										active
											? "text-product-primary"
											: "text-product-foreground-accent group-hover:text-product-primary"
									}`}
								/>
								<span>{doc.meta.title}</span>
							</Link>
						</li>
					);
				})}
			</ul>
		</nav>
	);
}
