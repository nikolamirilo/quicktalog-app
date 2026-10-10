import { ArrowRight, ChevronRight } from "lucide-react";
import Link from "next/link";

import { Container } from "@/components/general/Container";
import { IconTile } from "@/components/general/IconTile";
import { SectionHeading } from "@/components/general/SectionHeading";
import { TextLink } from "@/components/general/TextLink";
import { linkCardClass } from "@/components/resources/LinkCard";
import { getDocBySlug } from "@/lib/content/docs";
import { cn } from "@/lib/ui/cn";

const popularSlugs = [
	"getting-started",
	"create-a-catalogue",
	"share-your-catalogue",
	"plans-and-billing",
];

/** Short list of the most useful docs, shown under the Help Center FAQs. */
export function PopularGuides() {
	const docs = popularSlugs
		.map((slug) => getDocBySlug(slug))
		.filter((doc) => doc !== undefined);

	return (
		<section aria-labelledby="popular-guides-heading" className="pb-10 pt-2">
			<Container className="max-w-[944px]">
				<div className="mb-4 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1.5">
					<SectionHeading
						align="left"
						className="mb-0"
						id="popular-guides-heading"
						size="title"
						title="Popular guides"
					/>
					<TextLink className="inline-flex items-center gap-[7px]" href="/docs">
						All docs
						<ArrowRight
							aria-hidden="true"
							className="h-[15px] w-[15px] text-product-primary-ink"
						/>
					</TextLink>
				</div>
				<ul className="grid grid-cols-1 gap-2.5 md:grid-cols-2">
					{docs.map((doc) => {
						const Icon = doc.meta.icon;
						return (
							<li key={doc.meta.slug}>
								<Link
									className={cn(
										linkCardClass,
										"flex items-center gap-3 px-3.5 py-3",
									)}
									href={`/docs/${doc.meta.slug}`}
								>
									<IconTile size="sm">
										<Icon />
									</IconTile>
									<span className="min-w-0 flex-1">
										<b className="block text-[15px] leading-[1.3] text-product-foreground">
											{doc.meta.title}
										</b>
										<small className="text-[13px] text-product-muted">
											{doc.meta.readingTimeMinutes} min read
										</small>
									</span>
									<ChevronRight
										aria-hidden="true"
										className="h-4 w-4 text-product-muted"
									/>
								</Link>
							</li>
						);
					})}
				</ul>
			</Container>
		</section>
	);
}
