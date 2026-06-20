import ArticleCTA from "@/components/articles/ArticleCTA";
import ReadingProgress from "@/components/articles/ReadingProgress";
import TableOfContents from "@/components/articles/TableOfContents";
import DocHero from "@/components/docs/DocHero";
import DocPager from "@/components/docs/DocPager";
import DocsBreadcrumbs from "@/components/docs/DocsBreadcrumbs";
import DocsNav from "@/components/docs/DocsNav";
import RelatedDocs from "@/components/docs/RelatedDocs";
import Footer from "@/components/navigation/Footer";
import Navbar from "@/components/navigation/Navbar";
import { generateDocMetadata } from "@/constants/metadata";
import { generateDocSchema } from "@/constants/schemas";
import {
	getAdjacentDocs,
	getAllDocs,
	getAllDocSlugs,
	getDocBySlug,
	getRelatedDocs,
} from "@/helpers/docs";
import { ChevronDown } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

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
		<div className="font-lora bg-product-background">
			<script
				dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
				type="application/ld+json"
			/>
			<ReadingProgress />
			<Navbar />
			<div className="mx-auto max-w-[98rem] px-4 pb-20 pt-32 sm:px-6 lg:px-10 xl:px-12">
				<div className="lg:grid lg:grid-cols-[16rem_minmax(0,1fr)] lg:gap-12 xl:grid-cols-[16rem_minmax(0,1fr)_15rem] xl:gap-14">
					{/* Left: persistent docs navigation */}
					<aside className="hidden lg:block">
						<div className="sticky top-32 max-h-[calc(100vh-9rem)] overflow-y-auto pb-10">
							<DocsNav currentSlug={slug} />
						</div>
					</aside>

					{/* Center: topic content */}
					<article className="min-w-0">
						<div className="mx-auto max-w-[46rem] xl:max-w-[50rem]">
							<DocsBreadcrumbs title={meta.title} />

							{/* Mobile: docs nav collapses into a disclosure */}
							<details className="group mb-8 rounded-xl border border-product-border bg-product-background-hero lg:hidden">
								<summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3 text-sm font-semibold text-product-foreground [&::-webkit-details-marker]:hidden">
									Browse all docs
									<ChevronDown
										aria-hidden
										className="h-4 w-4 text-product-foreground-accent transition-transform group-open:rotate-180"
									/>
								</summary>
								<div className="border-t border-product-border px-2 py-3">
									<DocsNav
										currentSlug={slug}
										label="All documentation topics"
									/>
								</div>
							</details>

							<DocHero meta={meta} total={total} />

							<div id="doc-body">
								<Body />
							</div>

							<DocPager next={next} prev={prev} />
							<ArticleCTA variant="end" />
						</div>
					</article>

					{/* Right: on-this-page table of contents */}
					<aside className="hidden xl:block">
						<div className="sticky top-32 max-h-[calc(100vh-9rem)] overflow-y-auto pb-10">
							<TableOfContents targetId="doc-body" />
						</div>
					</aside>
				</div>

				<RelatedDocs docs={related} />
			</div>
			<Footer />
		</div>
	);
}
