import ArticleCTA from "@/components/articles/ArticleCTA";
import ArticleHero from "@/components/articles/ArticleHero";
import AuthorBio from "@/components/articles/AuthorBio";
import ReadingProgress from "@/components/articles/ReadingProgress";
import RelatedArticles from "@/components/articles/RelatedArticles";
import BackLink from "@/components/navigation/BackLink";
import Footer from "@/components/navigation/Footer";
import Navbar from "@/components/navigation/Navbar";
import { generateArticleMetadata } from "@/constants/metadata";
import { generateArticleSchema } from "@/constants/schemas";
import {
	getAllSlugs,
	getArticleBySlug,
	getRelatedArticles,
} from "@/helpers/articles";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

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
						<BackLink href="/articles" label="All articles" />
					</div>
					<ArticleHero meta={meta} />
					<Body />
					<ArticleCTA variant="end" />
					<AuthorBio author={meta.author} />
				</div>
				<RelatedArticles articles={related} />
			</article>
			<Footer />
		</div>
	);
}
