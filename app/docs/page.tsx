import type { Metadata } from "next";
import ArticleCTA from "@/components/articles/ArticleCTA";
import DocCard from "@/components/docs/DocCard";
import Footer from "@/components/navigation/Footer";
import Navbar from "@/components/navigation/Navbar";
import { generatePageMetadata } from "@/constants/metadata";
import { getPageSchema } from "@/constants/schemas";
import { getAllDocs } from "@/helpers/docs";

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
			<main className="mx-auto max-w-6xl px-4 pb-24 pt-32">
				<header className="mb-14 text-center">
					<span className="inline-flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.25em] text-product-secondary">
						<span className="h-px w-8 bg-product-primary" />
						Quicktalog Docs
						<span className="h-px w-8 bg-product-primary" />
					</span>
					<h1 className="mx-auto mt-5 max-w-3xl font-lora text-4xl font-bold leading-[1.05] text-product-foreground sm:text-5xl md:text-6xl">
						Learn Quicktalog, step by step
					</h1>
					<p className="mx-auto mt-5 max-w-2xl text-lg text-product-foreground-accent">
						Short, practical lessons that take you from a new account to a live
						catalogue you can share. Read them in order, or jump straight to the
						part you are on.
					</p>
				</header>

				<DocCard eyebrow="Start here" featured meta={first.meta} />

				<div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
					{rest.map((doc) => (
						<DocCard key={doc.meta.slug} meta={doc.meta} />
					))}
				</div>

				<div className="mt-20">
					<ArticleCTA
						body="Pick a starting point, drop in your items, and share a link or QR in minutes. The free plan is all you need to publish your first catalogue."
						heading="Ready to build yours?"
						variant="end"
					/>
				</div>
			</main>
			<Footer />
		</div>
	);
}
