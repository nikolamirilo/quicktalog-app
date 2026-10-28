import { ChevronRight, MapPin, Target } from "lucide-react";
import Link from "next/link";

import { Tag } from "@/components/manual/Inline";
import type { ManualPageMeta } from "@/content/manual/_types";
import { MANUAL_BASE, manualHref } from "@/lib/content/manual";

/**
 * Everything above the body of a page: where you are, the title, what the page
 * helps you do, what you end up with, how to reach the screen, and what you
 * need first.
 */
export function ManualPageHeader({
	meta,
	groupTitle,
	prerequisiteTitles,
}: {
	meta: ManualPageMeta;
	groupTitle: string;
	/** Titles of the pages named in `meta.before`, looked up by the page. */
	prerequisiteTitles?: Record<string, string>;
}) {
	return (
		<header>
			<nav aria-label="Breadcrumb">
				<ol className="flex flex-wrap items-center gap-1 text-[13px] text-product-muted">
					<li>
						<Link
							className="transition-colors hover:text-product-foreground"
							href={MANUAL_BASE}
						>
							Manual
						</Link>
					</li>
					<li aria-hidden="true">
						<ChevronRight className="h-3.5 w-3.5" />
					</li>
					<li>{groupTitle}</li>
					<li aria-hidden="true">
						<ChevronRight className="h-3.5 w-3.5" />
					</li>
					<li className="font-semibold text-product-foreground-accent">
						{meta.title}
					</li>
				</ol>
			</nav>

			{meta.badges?.length ? (
				<div className="mt-3.5 flex flex-wrap gap-1.5">
					{meta.badges.map((badge) => (
						<Tag key={badge} kind="plan">
							{badge}
						</Tag>
					))}
				</div>
			) : null}

			<h1 className="mt-2.5 font-product-heading text-title-app leading-[1.1] text-product-foreground">
				{meta.title}
			</h1>

			<div className="mt-4 grid gap-3 border-l-[3px] border-product-primary pl-4 sm:grid-cols-2 sm:gap-6">
				<div>
					<p className="text-[11.5px] font-bold uppercase tracking-[0.04em] text-product-muted">
						In short
					</p>
					<p className="mt-1 text-[15.5px] leading-[1.65] text-product-foreground-accent">
						{meta.inShort}
					</p>
				</div>
				{meta.result ? (
					<div className="border-t border-product-border pt-3 sm:border-0 sm:pt-0">
						<p className="flex items-center gap-1.5 text-[11.5px] font-bold uppercase tracking-[0.04em] text-product-muted">
							<Target aria-hidden="true" className="h-3.5 w-3.5" />
							Result
						</p>
						<p className="mt-1 text-[15.5px] leading-[1.65] text-product-foreground-accent">
							{meta.result}
						</p>
					</div>
				) : null}
			</div>

			{meta.where?.length ? (
				<div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1.5">
					<span className="flex items-center gap-1.5 text-[12.5px] font-semibold text-product-muted">
						<MapPin aria-hidden="true" className="h-3.5 w-3.5" />
						Where
					</span>
					{meta.where.map((step, index) => (
						<span className="flex items-center gap-2" key={step}>
							{index > 0 ? (
								<ChevronRight
									aria-hidden="true"
									className="h-3.5 w-3.5 text-product-border-hover"
								/>
							) : null}
							<span className="text-[13.5px] font-semibold text-product-foreground-accent">
								{step}
							</span>
						</span>
					))}
				</div>
			) : null}

			{meta.before?.length ? (
				<div className="mt-5 rounded-[16px] border border-product-border bg-product-card/70 p-4">
					<p className="text-[11.5px] font-bold uppercase tracking-[0.04em] text-product-muted">
						Before you start
					</p>
					<ul className="mt-1.5 grid gap-1.5 text-[14.5px] text-product-foreground-accent">
						{meta.before.map((item) => (
							<li
								className="grid grid-cols-[14px_minmax(0,1fr)] gap-x-2.5"
								key={item.text}
							>
								<span
									aria-hidden="true"
									className="mt-[9px] h-[5px] w-[5px] rounded-full bg-product-primary"
								/>
								<span>
									{item.text}
									{item.href ? (
										<>
											{" "}
											<Link
												className="font-semibold text-product-primary-ink underline decoration-product-primary/50 underline-offset-2"
												href={manualHref(item.href)}
											>
												{prerequisiteTitles?.[item.href] ?? "Read more"}
											</Link>
										</>
									) : null}
								</span>
							</li>
						))}
					</ul>
				</div>
			) : null}
		</header>
	);
}
