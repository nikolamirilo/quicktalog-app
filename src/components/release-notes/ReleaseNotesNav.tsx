"use client";

import { useEffect, useState } from "react";
import type { ReleaseNote } from "@/constants/releaseNotes";
import NominateFeatureLink from "./NominateFeatureLink";

interface Props {
	releases: ReleaseNote[];
}

/**
 * Highlights the release currently in view instead of the current route,
 * since every release lives on the same page as an anchor target.
 */
export default function ReleaseNotesNav({ releases }: Props) {
	const [activeSlug, setActiveSlug] = useState(releases[0]?.slug);

	useEffect(() => {
		const sections = releases
			.map((release) => document.getElementById(release.slug))
			.filter((el): el is HTMLElement => el !== null);

		if (sections.length === 0) return;

		const observer = new IntersectionObserver(
			(entries) => {
				const visible = entries.find((entry) => entry.isIntersecting);
				if (visible) setActiveSlug(visible.target.id);
			},
			{ rootMargin: "-15% 0px -70% 0px", threshold: 0 },
		);

		sections.forEach((section) => observer.observe(section));
		return () => observer.disconnect();
	}, [releases]);

	return (
		<nav aria-label="Releases">
			<p className="mb-3 px-3 text-xs font-semibold uppercase tracking-[0.2em] text-product-secondary">
				Releases
			</p>
			<ul className="space-y-0.5 border-l border-product-border">
				{releases.map((release) => {
					const active = release.slug === activeSlug;
					const dateLabel = new Date(release.date).toLocaleDateString("en-US", {
						month: "short",
						year: "numeric",
					});

					return (
						<li key={release.slug}>
							<a
								aria-current={active ? "true" : undefined}
								className={`-ml-px flex items-baseline gap-2 border-l-2 px-3 py-1.5 text-sm transition-colors ${
									active
										? "border-product-primary text-product-secondary font-semibold"
										: "border-transparent text-product-foreground-accent hover:text-product-secondary"
								}`}
								href={`#${release.slug}`}
							>
								<span className="font-semibold tabular-nums">
									{release.version}
								</span>
								<span className="text-xs text-product-foreground-accent">
									{dateLabel}
								</span>
							</a>
						</li>
					);
				})}
			</ul>

			<div className="mt-5 border-t border-product-border pt-4 pl-3">
				<p className="mb-2 text-xs text-product-foreground-accent">
					Want to see something in Quicktalog?
				</p>
				<NominateFeatureLink />
			</div>
		</nav>
	);
}
