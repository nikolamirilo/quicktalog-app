import { ArrowRight, ChevronRight } from "lucide-react";
import Link from "next/link";

import { Container } from "@/components/general/Container";
import { IconTile } from "@/components/general/IconTile";
import { SectionHeading } from "@/components/general/SectionHeading";
import { TextLink } from "@/components/general/TextLink";
import { linkCardClass } from "@/components/resources/LinkCard";
import {
	getManualGroup,
	getManualPopularPages,
	manualHref,
} from "@/lib/content/manual";
import { cn } from "@/lib/ui/cn";

/** Short list of the most useful manual pages, shown under the Help Center FAQs. */
export function PopularGuides() {
	const pages = getManualPopularPages();

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
					{pages.map(({ meta }) => {
						const Icon = getManualGroup(meta)?.icon;
						return (
							<li key={meta.slug}>
								<Link
									className={cn(
										linkCardClass,
										"flex items-center gap-3 px-3.5 py-3",
									)}
									href={manualHref(meta.slug)}
								>
									{Icon && (
										<IconTile size="sm">
											<Icon />
										</IconTile>
									)}
									<span className="min-w-0 flex-1">
										<b className="block text-[15px] leading-[1.3] text-product-foreground">
											{meta.title}
										</b>
										<small className="line-clamp-1 text-[13px] text-product-muted">
											{meta.inShort}
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
