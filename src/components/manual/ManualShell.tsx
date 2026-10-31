import { List } from "lucide-react";
import type { ReactNode } from "react";

import {
	ChecklistProgress,
	ChecklistProvider,
} from "@/components/manual/Checklist";
import { CopyLinkButton } from "@/components/manual/CopyLinkButton";
import { ManualPageHeader } from "@/components/manual/ManualPageHeader";
import { ManualPager } from "@/components/manual/ManualPager";
import { ManualSidebar } from "@/components/manual/ManualSidebar";
import { RelatedManualPages } from "@/components/manual/RelatedManualPages";
import { Container } from "@/components/general/Container";
import { PageDisclosure } from "@/components/resources/PageDisclosure";
import {
	MobileTableOfContents,
	TableOfContents,
	TableOfContentsProvider,
} from "@/components/resources/TableOfContents";
import type { ManualPageMeta } from "@/content/manual/_types";
import {
	getAdjacentManualPages,
	getManualGroup,
	getManualPage,
	getRelatedManualPages,
} from "@/lib/content/manual";

const BODY_ID = "manual-body";

/**
 * The frame every manual page shares: the module rail, the page header, the
 * body, and the "On this page" column. The site navbar sits above it; there is
 * no marketing footer, so a reader who is working does not scroll into one.
 */
export function ManualShell({
	meta,
	children,
}: {
	meta: ManualPageMeta;
	children: ReactNode;
}) {
	const group = getManualGroup(meta);
	const { prev, next } = getAdjacentManualPages(meta.slug);
	const related = getRelatedManualPages(meta.slug);
	const prerequisiteTitles = Object.fromEntries(
		(meta.before ?? [])
			.map((item) => item.href)
			.filter((slug): slug is string => Boolean(slug))
			.map((slug) => [slug, getManualPage(slug)?.meta.title ?? "Read more"]),
	);

	const body = (
		<div className="pb-16 pt-[120px] lg:pt-[150px]">
			<Container className="grid grid-cols-1 gap-7 lg:grid-cols-[254px_minmax(0,1fr)] lg:gap-10 min-[1240px]:grid-cols-[254px_minmax(0,1fr)_210px]">
				<aside className="sticky top-[100px] hidden max-h-[calc(100vh-130px)] self-start overflow-y-auto pb-4 lg:block">
					<ManualSidebar currentSlug={meta.slug} />
				</aside>

				<article className="min-w-0 max-w-[740px]">
					<PageDisclosure
						className="mb-[18px] lg:hidden"
						icon={<List />}
						label="Browse the manual"
					>
						<ManualSidebar currentSlug={meta.slug} />
					</PageDisclosure>

					<ManualPageHeader
						groupTitle={group?.title ?? ""}
						meta={meta}
						prerequisiteTitles={prerequisiteTitles}
					/>

					<MobileTableOfContents className="mt-5 min-[1240px]:hidden" />

					<div id={BODY_ID}>{children}</div>

					<div className="mt-9 flex justify-end">
						<CopyLinkButton />
					</div>
					<RelatedManualPages pages={related} />
					<ManualPager next={next} prev={prev} />
				</article>

				<aside className="sticky top-[100px] hidden max-h-[calc(100vh-130px)] self-start overflow-y-auto min-[1240px]:block">
					<ChecklistProgress />
					<TableOfContents />
				</aside>
			</Container>
		</div>
	);

	return (
		<TableOfContentsProvider targetId={BODY_ID}>
			{meta.checklist ? (
				<ChecklistProvider storageKey={meta.slug}>{body}</ChecklistProvider>
			) : (
				body
			)}
		</TableOfContentsProvider>
	);
}
