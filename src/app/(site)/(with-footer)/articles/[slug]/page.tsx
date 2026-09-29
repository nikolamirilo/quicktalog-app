import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ArticleHero } from "@/components/articles/ArticleHero";
import { AuthorBio } from "@/components/articles/AuthorBio";
import { Container } from "@/components/general/Container";
import { ProseBody } from "@/components/resources/ProseBody";
import { ReadingProgress } from "@/components/resources/ReadingProgress";
import { RelatedArticles } from "@/components/articles/RelatedArticles";
import { ResourcesCta } from "@/components/resources/ResourcesCta";
import { generateArticleMetadata } from "@/constants/metadata";
import { generateArticleSchema } from "@/constants/schemas";
import {
	getAllSlugs,
	getArticleBySlug,
	getRelatedArticles,
} from "@/lib/content/articles";

// Only the known slugs render. Anything else 404s.
export const dynamicParams = false;

export function generateStaticParams() {
	return getAllSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({
	params,
}: {
	params: Promise<{ slug: string }>;
}): Promise<Metadata> {
	const { slug } = await params;
	const article = getArticleBySlug(slug);
	if (!article) return {};
	return generateArticleMetadata(article.meta);
}

export default async function ArticlePage({
	params,
}: {
	params: Promise<{ slug: string }>;
}) {
	const { slug } = await params;
	const article = getArticleBySlug(slug);
	if (!article) notFound();

	const { meta, Body } = article;
	const related = getRelatedArticles(slug, 3);
	const schema = generateArticleSchema(meta);

	return (
		<>
			<script
				dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
				type="application/ld+json"
			/>
			<ReadingProgress targetId="article-body" />
			<article>
				<ArticleHero meta={meta} />
				<Container>
					<ProseBody className="mt-11 max-w-none" id="article-body">
						<Body />
					</ProseBody>
					<AuthorBio author={meta.author} />
				</Container>
			</article>
			<RelatedArticles articles={related} />
			<ResourcesCta />
		</>
	);
}
