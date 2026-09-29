import { FileText } from "lucide-react";
import type { Metadata } from "next";

import { ArticleCard } from "@/components/articles/ArticleCard";
import { ArticlesExplorer } from "@/components/articles/ArticlesExplorer";
import { ResourcesCta } from "@/components/resources/ResourcesCta";
import { Container } from "@/components/general/Container";
import { HeroKicker, PageHero } from "@/components/general/PageHero";
import { generatePageMetadata } from "@/constants/metadata";
import { getPageSchema } from "@/constants/schemas";
import { getAllArticles } from "@/lib/content/articles";

export const metadata: Metadata = generatePageMetadata("articles");

export default function ArticlesIndexPage() {
	const articles = getAllArticles();
	const featured = articles.find((a) => a.meta.featured) ?? articles[0];
	const rest = articles
		.filter((a) => a.meta.slug !== featured.meta.slug)
		.map((a) => a.meta);

	return (
		<>
			<script
				dangerouslySetInnerHTML={{
					__html: JSON.stringify(getPageSchema("articles")),
				}}
				type="application/ld+json"
			/>
			<PageHero
				kicker={
					<HeroKicker icon={<FileText />}>The Quicktalog Journal</HeroKicker>
				}
				lead="Practical advice on digital menus, product catalogs, QR codes, and getting more out of Quicktalog. Written for owners and teams, not developers."
				title="Guides for going digital"
			/>

			<section
				aria-labelledby="articles-all-h"
				className="pb-14 pt-7 lg:pb-20 lg:pt-9"
			>
				<Container>
					<h2 className="sr-only" id="articles-all-h">
						All articles
					</h2>
					<div className="mb-[34px]">
						<ArticleCard
							eyebrow="Editor's pick"
							featured
							meta={featured.meta}
						/>
					</div>
					<ArticlesExplorer articles={rest} />
				</Container>
			</section>

			<ResourcesCta
				description="Pick a template, drop in your items, and share a link or QR in minutes. The free plan is all you need to publish your first one."
				title="Stop reading, start building"
			/>
		</>
	);
}
