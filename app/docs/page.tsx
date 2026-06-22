import ArticleCTA from "@/components/articles/ArticleCTA";
import ArticleImage from "@/components/articles/ArticleImage";
import DocCard from "@/components/docs/DocCard";
import DocsNav from "@/components/docs/DocsNav";
import Footer from "@/components/navigation/Footer";
import Navbar from "@/components/navigation/Navbar";
import { generatePageMetadata } from "@/constants/metadata";
import { getPageSchema } from "@/constants/schemas";
import { getAllDocs } from "@/helpers/docs";
import type { Metadata } from "next";

export const metadata: Metadata = generatePageMetadata("docs");

export default function DocsIndexPage() {
	const docs = getAllDocs();
	const [first, ...rest] = docs;

	return (
		<div className="font-lora bg-product-background">
			<script
				dangerouslySetInnerHTML={{
					__html: JSON.stringify(getPageSchema("docs")),
				}}
				type="application/ld+json"
			/>
			<Navbar />
			<div className="mx-auto max-w-[98rem] px-4 pb-24 pt-32 sm:px-6 lg:px-10 xl:px-12">
				<div className="lg:grid lg:grid-cols-[16rem_minmax(0,1fr)] lg:gap-12">
					{/* Left: persistent docs navigation */}
					<aside className="hidden lg:block">
						<div className="sticky top-32 max-h-[calc(100vh-9rem)] overflow-y-auto pb-10">
							<DocsNav />
						</div>
					</aside>

					{/* Center: overview + topic grid */}
					<main className="min-w-0">
						<header className="mb-10 pb-8">
							<span className="inline-flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.25em] text-product-secondary">
								<span className="h-px w-8 bg-product-primary" />
								Quicktalog Docs
							</span>
							<h1 className="mt-5 font-lora text-3xl font-bold leading-[1.1] text-product-foreground sm:text-4xl md:text-5xl">
								Learn Quicktalog, step by step
							</h1>
							<p className="mt-4 max-w-[44rem] text-lg leading-relaxed text-product-foreground-accent">
								Short, practical lessons that take you from a new account to a
								live catalogue you can share. Read them in order, or jump
								straight to the part you are on.
							</p>
							<ArticleImage
								alt="Six-step learning path from sign-up to a live shared catalogue"
								maxWidth="890px"
								priority
								className="mr-auto"
								src="/documentation/docs-landing-cover.svg"
							/>
						</header>

						<DocCard eyebrow="Start here" featured meta={first.meta} />

						<div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
							{rest.map((doc) => (
								<DocCard key={doc.meta.slug} meta={doc.meta} />
							))}
						</div>



						<div className="mt-14">
							<ArticleCTA
								body="Pick a starting point, drop in your items, and share a link or QR in minutes. The free plan is all you need to publish your first catalogue."
								heading="Ready to build yours?"
								variant="end"
							/>
						</div>
					</main>
				</div>
			</div>
			<Footer />
		</div>
	);
}
