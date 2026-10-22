import type { Metadata } from "next";
import { List } from "lucide-react";
import { notFound } from "next/navigation";

import { ProseBody } from "@/components/resources/ProseBody";
import { ReadingProgress } from "@/components/resources/ReadingProgress";
import { ResourcesCta } from "@/components/resources/ResourcesCta";
import { PageDisclosure } from "@/components/resources/PageDisclosure";
import {
	MobileTableOfContents,
	TableOfContents,
	TableOfContentsProvider,
} from "@/components/resources/TableOfContents";
import { Container } from "@/components/general/Container";
import { DocHelpful } from "@/components/docs/DocHelpful";
import { DocHero } from "@/components/docs/DocHero";
import { DocPager } from "@/components/docs/DocPager";
import { DocsBreadcrumbs } from "@/components/docs/DocsBreadcrumbs";
import { DocsNav } from "@/components/docs/DocsNav";
import { RelatedDocs } from "@/components/docs/RelatedDocs";
import { generateDocMetadata } from "@/constants/metadata";
import { generateDocSchema } from "@/constants/schemas";
import {
	getAdjacentDocs,
	getAllDocs,
	getAllDocSlugs,
	getDocBySlug,
	getRelatedDocs,
} from "@/lib/content/docs";

// Only the known slugs render. Anything else 404s.
export const dynamicParams = false;

export function generateStaticParams() {
	return getAllDocSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({
	params,
}: {
	params: Promise<{ slug: string }>;
}): Promise<Metadata> {
	const { slug } = await params;
	const doc = getDocBySlug(slug);
	if (!doc) return {};
	return generateDocMetadata(doc.meta);
}

export default async function DocsTopicPage({
	params,
}: {
	params: Promise<{ slug: string }>;
}) {
	const { slug } = await params;
	const doc = getDocBySlug(slug);
	if (!doc) notFound();

	const { meta, Body } = doc;
	const total = getAllDocs().length;
	const { prev, next } = getAdjacentDocs(slug);
	const related = getRelatedDocs(slug, 3);
	const schema = generateDocSchema(meta);

	return (
		<>
			<script
				dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
				type="application/ld+json"
			/>
			<ReadingProgress targetId="doc-body" />
			<TableOfContentsProvider targetId="doc-body">
				<div className="pt-[104px] lg:pt-[120px]">
					<Container className="grid grid-cols-1 gap-7 lg:grid-cols-[250px_minmax(0,1fr)] lg:gap-12 min-[1240px]:grid-cols-[250px_minmax(0,1fr)_210px]">
						{/* Left: the docs guide */}
						<aside className="sticky top-[100px] hidden max-h-[calc(100vh-120px)] self-start overflow-y-auto pb-3 lg:block">
							<DocsNav currentSlug={slug} />
						</aside>

						{/* Centre: the doc */}
						<article className="min-w-0">
							<DocsBreadcrumbs title={meta.title} />
							<PageDisclosure
								className="mb-[18px] lg:hidden"
								icon={<List />}
								label="Browse all docs"
								meta={`Part ${meta.order} of ${total}`}
							>
								<DocsNav
									currentSlug={slug}
									showHeading={false}
									showHelp={false}
								/>
							</PageDisclosure>
							<DocHero meta={meta} total={total} />
							<MobileTableOfContents className="min-[1240px]:hidden" />
							<ProseBody id="doc-body">
								<Body />
							</ProseBody>
							<div className="max-w-[720px]">
								<DocHelpful />
								<DocPager next={next} prev={prev} />
							</div>
						</article>

						{/* Right: on this page */}
						<aside className="sticky top-[100px] hidden max-h-[calc(100vh-120px)] self-start overflow-y-auto min-[1240px]:block">
							<TableOfContents />
						</aside>
					</Container>
				</div>
			</TableOfContentsProvider>
			<RelatedDocs docs={related} total={total} />
			<ResourcesCta
				description="Pick a starting point, drop in your items, and share a link or QR in minutes. The free plan is all you need to publish your first catalogue."
				title="Ready to build yours?"
			/>
		</>
	);
}
