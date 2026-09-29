"use client";

import { filterChipClass } from "@/components/general/FilterChip";
import { useActiveRelease } from "@/components/release-notes/ActiveRelease";
import { NominateFeatureLink } from "@/components/release-notes/NominateFeatureLink";
import { VersionPill } from "@/components/release-notes/VersionPill";
import type { ReleaseNote } from "@/constants/releaseNotes";
import { formatIsoDay } from "@/lib/format/date";
import { cn } from "@/lib/ui/cn";

interface Props {
	releases: ReleaseNote[];
}

/** "Nov 2025": the short month used in the release lists. */
const shortMonth = (date: string) =>
	formatIsoDay(date, { month: "short", year: "numeric" });

/**
 * Sticky "Releases" list for wide screens, highlighting the release in view.
 * Must sit inside `ActiveReleaseProvider`.
 */
export function ReleaseNotesNav({ releases }: Props) {
	const activeSlug = useActiveRelease();

	return (
		<nav aria-label="Releases">
			<p className="mb-2 ml-2.5 text-xs font-bold uppercase tracking-[0.1em] text-product-muted">
				Releases
			</p>
			<ol className="grid gap-0.5">
				{releases.map((release) => {
					const active = release.slug === activeSlug;
					return (
						<li key={release.slug}>
							<a
								aria-current={active ? "location" : undefined}
								className={cn(
									"flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-[13.5px] font-semibold transition-colors",
									active
										? "bg-product-primary-soft text-product-foreground ring-1 ring-inset ring-product-primary/55"
										: "text-product-muted hover:bg-product-background-hero hover:text-product-foreground",
								)}
								href={`#${release.slug}`}
							>
								<VersionPill
									className={cn(
										!active &&
											"bg-product-background-hero text-product-foreground-accent",
									)}
									size="sm"
									version={release.version}
								/>
								<small className="text-[13px]">
									{shortMonth(release.date)}
								</small>
							</a>
						</li>
					);
				})}
			</ol>
			<div className="mt-[18px] rounded-2xl border border-product-border bg-product-card p-3.5">
				<p className="mb-2 text-[13.5px] text-product-foreground-accent">
					Want to see something in Quicktalog?
				</p>
				<NominateFeatureLink className="text-sm" />
			</div>
		</nav>
	);
}

/**
 * Horizontal release chips shown above the timeline on narrow screens. Must
 * sit inside `ActiveReleaseProvider`.
 */
export function ReleaseNotesChips({ releases }: Props) {
	const activeSlug = useActiveRelease();

	return (
		<nav
			aria-label="Jump to a release"
			className="-mx-5 mb-[22px] flex gap-2 overflow-x-auto px-5 pb-1.5 pt-0.5 [scrollbar-width:none] lg:hidden [&::-webkit-scrollbar]:hidden"
		>
			{releases.map((release) => {
				const active = release.slug === activeSlug;
				return (
					<a
						aria-current={active ? "location" : undefined}
						className={filterChipClass(active)}
						href={`#${release.slug}`}
						key={release.slug}
					>
						{release.version} · {shortMonth(release.date)}
					</a>
				);
			})}
		</nav>
	);
}
