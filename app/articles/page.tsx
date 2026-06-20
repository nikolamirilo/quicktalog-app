import type { Metadata } from "next";
import ArticleCard from "@/components/articles/ArticleCard";
import ArticleCTA from "@/components/articles/ArticleCTA";
import ArticlesExplorer from "@/components/articles/ArticlesExplorer";
import Footer from "@/components/navigation/Footer";
import Navbar from "@/components/navigation/Navbar";
import { generatePageMetadata } from "@/constants/metadata";
import { getPageSchema } from "@/constants/schemas";
import { getAllArticles } from "@/helpers/articles";

export const metadata: Metadata = generatePageMetadata("articles");

export default function ArticlesIndexPage() {
	const articles = getAllArticles();
	const featured = articles.find((a) => a.meta.featured) ?? articles[0];
	const metas = articles.map((a) => a.meta);

	return (
		<div className="font-lora bg-product-background">
			<script
				dangerouslySetInnerHTML={{
					__html: JSON.stringify(getPageSchema("articles")),
				}}
				type="application/ld+json"
			/>
			<Navbar />
			<main className="mx-auto max-w-6xl px-4 pb-24 pt-32">
				<header className="mb-14 text-center">
					<span className="inline-flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.25em] text-product-secondary">
						<span className="h-px w-8 bg-product-primary" />
						The Quicktalog Journal
						<span className="h-px w-8 bg-product-primary" />
					</span>
					<h1 className="mx-auto mt-5 max-w-3xl font-lora text-4xl font-bold leading-[1.05] text-product-foreground sm:text-5xl md:text-6xl">
						Guides for going digital
					</h1>
					<p className="mx-auto mt-5 max-w-2xl text-lg text-product-foreground-accent">
						Practical advice on digital menus, product catalogs, QR codes, and
						getting more out of Quicktalog. Written for owners and teams, not
						developers.
					</p>
				</header>

				<ArticleCard eyebrow="Editor's pick" featured meta={featured.meta} />

				<ArticlesExplorer featuredSlug={featured.meta.slug} metas={metas} />

				<div className="mt-20">
					<ArticleCTA
						body="Pick a template, drop in your items, and share a link or QR in minutes. The free plan is all you need to publish your first one."
						heading="Stop reading, start building"
						variant="end"
					/>
				</div>
			</main>
			<Footer />
		</div>
	);
}
