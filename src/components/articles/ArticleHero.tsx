import type { ArticleMeta } from "@/content/articles/_types";
import ArticleImage from "./ArticleImage";
import AuthorByline from "./AuthorByline";

/** Title block: category kicker, H1, description, byline, and hero image. */
export default function ArticleHero({ meta }: { meta: ArticleMeta }) {
	return (
		<header className="mb-10 text-center">
			<span className="inline-flex items-center gap-2 rounded-full border border-product-border bg-product-background px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.15em] text-product-secondary">
				<span className="h-1.5 w-1.5 rounded-full bg-product-primary" />
				{meta.category}
			</span>
			<h1 className="mt-6 font-lora text-4xl font-bold leading-[1.1] text-product-foreground sm:text-5xl">
				{meta.title}
			</h1>
			<p className="mx-auto mt-5 max-w-2xl text-lg text-product-foreground-accent">
				{meta.description}
			</p>
			<div className="mt-6">
				<AuthorByline
					author={meta.author}
					publishedAt={meta.publishedAt}
					readingTimeMinutes={meta.readingTimeMinutes}
				/>
			</div>
			<div className="mt-10">
				<ArticleImage
					alt={meta.heroImageAlt}
					credit={meta.heroCredit}
					priority
					src={meta.heroImage}
				/>
			</div>
		</header>
	);
}
