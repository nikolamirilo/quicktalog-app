import type { Metadata } from "next";
import ArticleCTA from "@/components/articles/ArticleCTA";
import Footer from "@/components/navigation/Footer";
import Navbar from "@/components/navigation/Navbar";
import NominateFeatureLink from "@/components/release-notes/NominateFeatureLink";
import ReleaseNoteEntry from "@/components/release-notes/ReleaseNoteEntry";
import ReleaseNotesNav from "@/components/release-notes/ReleaseNotesNav";
import { generatePageMetadata } from "@/constants/metadata";
import { releaseNotes } from "@/constants/releaseNotes";
import { getPageSchema } from "@/constants/schemas";

export const metadata: Metadata = generatePageMetadata("releaseNotes");

export default function ReleaseNotesPage() {
	return (
		<div className="font-lora bg-product-background">
			<script
				dangerouslySetInnerHTML={{
					__html: JSON.stringify(getPageSchema("releaseNotes")),
				}}
				type="application/ld+json"
			/>
			<Navbar />
			<div className="mx-auto max-w-6xl px-4 pb-24 pt-32 sm:px-6 lg:px-10">
				<div className="lg:grid lg:grid-cols-[16rem_minmax(0,1fr)] lg:gap-12">
					<aside className="hidden lg:block">
						<div className="sticky top-32">
							<ReleaseNotesNav releases={releaseNotes} />
						</div>
					</aside>

					<main className="mx-auto max-w-3xl min-w-0 lg:mx-0 lg:max-w-none">
						<header className="mb-14 text-center lg:text-left">
							<span className="inline-flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.25em] text-product-secondary">
								<span className="h-px w-8 bg-product-primary" />
								Release Updates
							</span>
							<h1 className="mt-5 font-lora text-4xl font-bold leading-[1.05] text-product-foreground sm:text-5xl">
								Release notes
							</h1>
							<p className="mt-5 text-lg text-product-foreground-accent">
								Every release, in one place: what is new, what got better, and
								what we fixed in Quicktalog.
							</p>

							<div className="mt-5 lg:hidden">
								<NominateFeatureLink />
							</div>
						</header>

						<div className="relative">
							<div className="pointer-events-none absolute left-[6px] top-2 bottom-2 w-px bg-product-border" />
							<div className="space-y-14">
								{releaseNotes.map((release, index) => (
									<ReleaseNoteEntry
										isLatest={index === 0}
										key={release.slug}
										release={release}
									/>
								))}
							</div>
						</div>

						<ArticleCTA
							body="Pick a template, drop in your items, and share a link or QR in minutes. The free plan is all you need to publish your first one."
							heading="Stop reading, start building"
							variant="end"
						/>
					</main>
				</div>
			</div>
			<Footer />
		</div>
	);
}
