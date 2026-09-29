import type { Metadata } from "next";

import { ResourcesCta } from "@/components/resources/ResourcesCta";
import { Container } from "@/components/general/Container";
import { HeroKicker, PageHero } from "@/components/general/PageHero";
import { ActiveReleaseProvider } from "@/components/release-notes/ActiveRelease";
import { NominateFeatureLink } from "@/components/release-notes/NominateFeatureLink";
import { ReleaseNoteEntry } from "@/components/release-notes/ReleaseNoteEntry";
import {
	ReleaseNotesNav,
	ReleaseNotesChips,
} from "@/components/release-notes/ReleaseNotesNav";
import { ReleaseTagBadge } from "@/components/release-notes/ReleaseTagBadge";
import { generatePageMetadata } from "@/constants/metadata";
import { releaseNotes } from "@/constants/releaseNotes";
import { getPageSchema } from "@/constants/schemas";

export const metadata: Metadata = generatePageMetadata("releaseNotes");

export default function ReleaseNotesPage() {
	return (
		<>
			<script
				dangerouslySetInnerHTML={{
					__html: JSON.stringify(getPageSchema("releaseNotes")),
				}}
				type="application/ld+json"
			/>
			<PageHero
				align="left"
				kicker={
					<HeroKicker
						icon={
							<span className="grid h-full w-full place-items-center rounded-full bg-product-primary-soft">
								<span className="h-2 w-2 rounded-full bg-product-primary motion-safe:animate-pulse" />
							</span>
						}
					>
						Release Updates
					</HeroKicker>
				}
				lead="Every release, in one place: what is new, what got better, and what we fixed in Quicktalog."
				title="Release notes"
			>
				<ul aria-label="Legend" className="mt-[22px] flex flex-wrap gap-2">
					<li>
						<ReleaseTagBadge tag="New" />
					</li>
					<li>
						<ReleaseTagBadge tag="Improved" />
					</li>
					<li>
						<ReleaseTagBadge tag="Fixed" />
					</li>
				</ul>
			</PageHero>

			<ActiveReleaseProvider
				slugs={releaseNotes.map((release) => release.slug)}
			>
				<Container className="grid grid-cols-1 gap-7 pb-12 pt-7 lg:grid-cols-[210px_minmax(0,1fr)] lg:gap-12 lg:pt-9">
					<aside className="sticky top-[100px] hidden self-start lg:block">
						<ReleaseNotesNav releases={releaseNotes} />
					</aside>

					<div className="min-w-0 lg:max-w-[860px]">
						<ReleaseNotesChips releases={releaseNotes} />
						<ol className="relative grid gap-[22px] pl-7 before:absolute before:bottom-3.5 before:left-2 before:top-3.5 before:border-l-2 before:border-dashed before:border-product-primary/70 before:content-['']">
							{releaseNotes.map((release, index) => (
								<ReleaseNoteEntry
									isLatest={index === 0}
									key={release.slug}
									release={release}
								/>
							))}
						</ol>
						<p className="mt-[22px] flex flex-wrap items-center gap-x-2.5 gap-y-1.5 text-[15px] text-product-foreground-accent lg:hidden">
							Want to see something in Quicktalog? <NominateFeatureLink />
						</p>
					</div>
				</Container>
			</ActiveReleaseProvider>

			<ResourcesCta
				description="Pick a template, drop in your items, and share a link or QR in minutes. The free plan is all you need to publish your first one."
				title="Stop reading, start building"
			/>
		</>
	);
}
