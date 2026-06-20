import ArticleCTA from "@/components/articles/ArticleCTA";
import ReadingProgress from "@/components/articles/ReadingProgress";
import DocHero from "@/components/docs/DocHero";
import DocPager from "@/components/docs/DocPager";
import RelatedDocs from "@/components/docs/RelatedDocs";
import BackLink from "@/components/navigation/BackLink";
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
			<article className="pb-20 pt-24">
				<div className="mx-auto max-w-5xl px-4">
					<div className="mb-8 mt-8">
						<BackLink href="/docs" label="All docs" />
					</div>
					<DocHero meta={meta} total={total} />
					<Body />
					<DocPager next={next} prev={prev} />
					<ArticleCTA variant="end" />
				</div>
				<RelatedDocs docs={related} />
			</article>
			<Footer />
		</div>
	);
}
