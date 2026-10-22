import { BookOpen, Clock, ListOrdered } from "lucide-react";
import Link from "next/link";

import { Container } from "@/components/general/Container";
import { Eyebrow } from "@/components/general/Eyebrow";
import { type LegalDocumentKey, legalDocuments } from "@/constants/legal";
import { formatIsoDay } from "@/lib/format/date";
import { cn } from "@/lib/ui/cn";

/** The legal page header: document tabs, title and the meta pills. */
export function LegalHero({
	current,
	title,
	updated,
	readMinutes,
	sectionCount,
}: {
	current: LegalDocumentKey;
	title: string;
	/** ISO day the document last changed. */
	updated: string;
	readMinutes: number;
	sectionCount: number;
}) {
	return (
		<header className="relative isolate overflow-hidden border-b border-product-border bg-gradient-to-b from-product-primary-soft/65 to-product-background/0 pb-9 pt-[120px] lg:pb-12 lg:pt-[150px]">
			<div
				aria-hidden="true"
				className="pointer-events-none absolute -right-[180px] -top-[120px] -z-10 size-[560px] rounded-full bg-[radial-gradient(closest-side,rgba(255,176,32,0.22),rgba(255,176,32,0.06)_60%,transparent)]"
			/>
			<Container>
				<div className="max-w-[1180px]">
					<nav
						aria-label="Legal documents"
						className="mb-[26px] inline-flex max-w-full gap-0.5 rounded-full border border-product-border bg-product-card p-1 shadow-[0_1px_2px_rgba(22,20,15,0.04)]"
					>
						{legalDocuments.map((document) => (
							<Link
								aria-current={document.key === current ? "page" : undefined}
								className={cn(
									"inline-flex h-9 items-center rounded-full border px-4 text-sm transition-colors",
									document.key === current
										? "border-product-primary/55 bg-product-primary-soft font-bold text-product-foreground"
										: "border-transparent font-semibold text-product-foreground-accent hover:bg-product-background-hero hover:text-product-foreground",
								)}
								href={document.href}
								key={document.key}
							>
								{document.tab}
							</Link>
						))}
					</nav>
					<Eyebrow className="block">Legal</Eyebrow>
					<h1 className="max-w-[18ch] text-balance text-[clamp(34px,5vw,58px)] font-extrabold leading-[1.05] tracking-[-0.035em]">
						{title}
					</h1>
					<p className="mt-5 flex flex-wrap gap-2 [&>span]:inline-flex [&>span]:h-[34px] [&>span]:items-center [&>span]:gap-[7px] [&>span]:rounded-full [&>span]:border [&>span]:border-product-border [&>span]:bg-product-card [&>span]:px-[13px] [&>span]:text-[13.5px] [&>span]:font-medium [&>span]:text-product-foreground-accent [&_svg]:size-[15px] [&_svg]:text-product-primary-ink">
						<span>
							<Clock aria-hidden="true" />
							Last updated{" "}
							<time
								className="font-semibold text-product-foreground"
								dateTime={updated}
							>
								{formatIsoDay(updated)}
							</time>
						</span>
						<span>
							<BookOpen aria-hidden="true" />
							{readMinutes} min read
						</span>
						<span>
							<ListOrdered aria-hidden="true" />
							{sectionCount} sections
						</span>
					</p>
				</div>
			</Container>
		</header>
	);
}
