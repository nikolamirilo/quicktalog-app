import type { ReleaseNote, ReleaseNoteTag } from "@/constants/releaseNotes";
import { ReleaseTagBadge } from "@/components/release-notes/ReleaseTagBadge";
import { VersionPill } from "@/components/release-notes/VersionPill";
import { formatIsoDay } from "@/lib/format/date";
import { cn } from "@/lib/ui/cn";

interface Props {
	release: ReleaseNote;
	isLatest?: boolean;
}

const tagOrder: ReleaseNoteTag[] = ["New", "Improved", "Fixed"];

/** One release on the timeline: dot, card with version, date, title, summary and items. */
export function ReleaseNoteEntry({ release, isLatest = false }: Props) {
	const counts = tagOrder
		.map((tag) => ({
			tag,
			count: release.items.filter((item) => item.tag === tag).length,
		}))
		.filter(({ count }) => count > 0);

	return (
		<li className="relative scroll-mt-[100px]" id={release.slug}>
			<span
				aria-hidden="true"
				className={cn(
					"absolute -left-7 top-[26px] h-[18px] w-[18px] rounded-full border-[3px] border-product-primary shadow-[0_0_0_5px_var(--product-background)]",
					isLatest ? "bg-product-primary" : "bg-product-card",
				)}
			/>
			<article
				aria-labelledby={`${release.slug}-h`}
				className="rounded-product-card border border-product-border bg-product-card px-5 py-[22px] shadow-product sm:px-7 sm:py-[26px]"
			>
				<div className="flex flex-wrap items-center gap-x-2.5 gap-y-2">
					<VersionPill version={release.version} />
					<time
						className="text-sm font-semibold text-product-muted"
						dateTime={release.date}
					>
						{formatIsoDay(release.date, { month: "long", year: "numeric" })}
					</time>
					{isLatest && (
						<span className="inline-flex h-6 items-center rounded-full bg-product-primary px-2.5 text-xs font-bold text-product-foreground shadow-product-primary">
							Latest
						</span>
					)}
				</div>
				<h2
					className="mt-3 text-[clamp(22px,2.6vw,30px)] font-extrabold tracking-[-0.025em] text-product-foreground"
					id={`${release.slug}-h`}
				>
					{release.title}
				</h2>
				<p className="mt-3 flex flex-wrap gap-1.5">
					<span className="sr-only">Summary: </span>
					{counts.map(({ tag, count }) => (
						<ReleaseTagBadge key={tag} tag={tag}>
							{count} {tag}
						</ReleaseTagBadge>
					))}
				</p>
				<ul className="mt-4 grid gap-3 border-t border-product-border pt-4">
					{release.items.map((item) => (
						<li
							className="flex flex-col items-start gap-1.5 text-[15.5px] leading-[1.6] text-product-foreground-accent sm:flex-row sm:gap-3.5"
							key={item.text}
						>
							<ReleaseTagBadge
								className="justify-center sm:mt-px sm:min-w-[100px]"
								tag={item.tag}
							/>
							<span>{item.text}</span>
						</li>
					))}
				</ul>
			</article>
		</li>
	);
}
