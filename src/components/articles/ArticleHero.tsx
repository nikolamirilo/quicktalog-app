import { ArticleCover } from "@/components/articles/ArticleCover";
import { AuthorByline } from "@/components/articles/AuthorByline";
import { CategoryTag } from "@/components/resources/CategoryTag";
import { ResourceBackLink } from "@/components/articles/ResourceBackLink";
import { Container } from "@/components/general/Container";
import { HeroBackdrop } from "@/components/general/PageHero";
import type { ArticleMeta } from "@/content/articles/_types";

/** Article header: back link, category, H1, summary, byline and the cover banner. */
export function ArticleHero({ meta }: { meta: ArticleMeta }) {
	return (
		<header className="relative isolate overflow-hidden pt-28 lg:pt-[148px]">
			<HeroBackdrop />
			<Container className="flex flex-col items-start gap-3.5">
				<ResourceBackLink href="/articles" label="All articles" />
				<CategoryTag>{meta.category}</CategoryTag>
				<h1 className="max-w-[860px] text-balance text-[clamp(30px,4.6vw,52px)] font-extrabold leading-[1.08] tracking-[-0.035em] text-product-foreground">
					{meta.title}
				</h1>
				<p className="max-w-[62ch] text-[clamp(17px,1.6vw,20px)] leading-[1.6] text-product-foreground-accent">
					{meta.description}
				</p>
				<AuthorByline
					author={meta.author}
					publishedAt={meta.publishedAt}
					readingTimeMinutes={meta.readingTimeMinutes}
				/>
			</Container>
			<Container className="mt-[30px]">
				<ArticleCover
					className="rounded-product-panel border border-product-border shadow-product"
					cover={meta.cover}
					size="lg"
				/>
			</Container>
		</header>
	);
}
