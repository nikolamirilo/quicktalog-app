import { ArrowRight, BookOpen, LifeBuoy } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { ResourcesCta } from "@/components/resources/ResourcesCta";
import { DocCard } from "@/components/docs/DocCard";
import { Container } from "@/components/general/Container";
import { IconTile } from "@/components/general/IconTile";
import { HeroKicker, PageHero } from "@/components/general/PageHero";
import { Button } from "@/components/ui/button";
import { generatePageMetadata } from "@/constants/metadata";
import { getPageSchema } from "@/constants/schemas";
import { getAllDocs } from "@/lib/content/docs";

export const metadata: Metadata = generatePageMetadata("docs");

export default function DocsIndexPage() {
	const docs = getAllDocs();
	const [first, ...rest] = docs;
	const total = docs.length;

	return (
		<>
			<script
				dangerouslySetInnerHTML={{
					__html: JSON.stringify(getPageSchema("docs")),
				}}
				type="application/ld+json"
			/>
			<PageHero
				kicker={<HeroKicker icon={<BookOpen />}>Quicktalog Docs</HeroKicker>}
				lead="Short, practical lessons that take you from a new account to a live catalogue you can share. Read them in order, or jump straight to the part you are on."
				title="Learn Quicktalog, step by step"
			>
				<nav aria-label="Learning path" className="mt-[26px]">
					<ol className="flex flex-wrap justify-center gap-2">
						{docs.map((doc) => (
							<li key={doc.meta.slug}>
								<Link
									className="inline-flex min-h-[38px] items-center gap-[7px] rounded-full border border-product-border bg-product-card py-0 pl-[5px] pr-[13px] text-[13.5px] font-semibold text-product-foreground-accent transition-colors hover:border-product-primary hover:text-product-foreground"
									href={`/docs/${doc.meta.slug}`}
								>
									<span className="grid h-[27px] w-[27px] place-items-center rounded-full bg-product-primary-soft font-product-heading text-[12.5px] font-extrabold leading-none text-product-primary-ink">
										{doc.meta.order}
									</span>
									<span>{doc.meta.tag}</span>
								</Link>
							</li>
						))}
					</ol>
				</nav>
			</PageHero>

			<section
				aria-labelledby="docs-all-h"
				className="pb-14 pt-7 lg:pb-20 lg:pt-9"
			>
				<Container>
					<h2 className="sr-only" id="docs-all-h">
						All docs
					</h2>
					<DocCard featured meta={first.meta} total={total} />

					<div className="mt-[18px] grid grid-cols-1 gap-[18px] md:grid-cols-2 lg:grid-cols-3 lg:gap-[22px]">
						{rest.map((doc) => (
							<DocCard key={doc.meta.slug} meta={doc.meta} total={total} />
						))}
						<div className="flex flex-col items-start gap-3.5 rounded-product-card border border-product-border bg-product-card p-[22px] shadow-product lg:col-span-2 lg:flex-col lg:items-start lg:justify-center lg:border-product-primary/45 lg:bg-product-amber-panel lg:p-7">
							<IconTile>
								<LifeBuoy />
							</IconTile>
							<div>
								<h3 className="font-product-heading text-lg font-bold leading-[1.3] text-product-foreground">
									Looking for a quick answer?
								</h3>
								<p className="mt-1 text-[15px] text-product-foreground-accent">
									The Help Center has short answers to the questions we hear
									most.
								</p>
							</div>
							<Button asChild className="group" variant="outline">
								<Link href="/help">
									Open the Help Center
									<ArrowRight
										aria-hidden="true"
										className="transition-transform group-hover:translate-x-[3px]"
									/>
								</Link>
							</Button>
						</div>
					</div>
				</Container>
			</section>

			<ResourcesCta
				description="Pick a starting point, drop in your items, and share a link or QR in minutes. The free plan is all you need to publish your first catalogue."
				title="Ready to build yours?"
			/>
		</>
	);
}
