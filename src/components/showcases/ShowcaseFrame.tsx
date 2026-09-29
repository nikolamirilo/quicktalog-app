"use client";

import { ExternalLink, Globe } from "lucide-react";

import { BrowserChrome } from "@/components/general/BrowserChrome";
import type { ShowcaseItem } from "@/constants/marketing";
import { useSwipe } from "@/hooks/useSwipe";

/**
 * The live catalogue in a browser frame. One iframe for every screen size:
 * from `lg` CSS renders it at 4/3 size and scales it to 75%, so the desktop
 * layout fits; below `lg` it fills the frame and swipes change catalogue.
 */
export function ShowcaseFrame({
	item,
	onNext,
	onPrevious,
}: {
	item: ShowcaseItem;
	onNext: () => void;
	onPrevious: () => void;
}) {
	const swipe = useSwipe({ onNext, onPrevious });

	return (
		<div className="flex h-[min(78svh,720px)] min-h-[500px] min-w-0 flex-1 flex-col overflow-hidden rounded-product-card border border-product-border bg-product-card shadow-product lg:h-auto lg:min-h-0">
			<BrowserChrome
				className="h-[46px] bg-product-background-hero"
				dotsClassName="hidden sm:flex"
				icon={
					<Globe
						aria-hidden="true"
						className="h-[13px] w-[13px] text-product-primary-ink"
					/>
				}
				pillClassName="h-[30px] border border-product-border bg-product-card px-3"
				trailing={
					<a
						aria-label="Open catalogue in new tab"
						className="inline-flex h-[30px] flex-none items-center gap-1.5 rounded-full border border-product-border bg-product-card px-2.5 text-[12.5px] font-semibold text-product-foreground-accent transition-colors hover:border-product-primary hover:text-product-foreground"
						href={item.src}
						rel="noopener noreferrer"
						target="_blank"
					>
						<ExternalLink aria-hidden="true" className="h-[13px] w-[13px]" />
						<span className="hidden sm:inline">Open</span>
					</a>
				}
				url={
					<span className="min-w-0 flex-1 truncate font-mono text-[11.5px]">
						{item.src}
					</span>
				}
			/>

			<div
				className="relative min-h-0 flex-1 touch-pan-y overflow-hidden bg-product-card"
				{...swipe}
			>
				<div
					className="absolute inset-0 overflow-hidden duration-200 animate-in fade-in"
					key={item.src}
				>
					<iframe
						className="pointer-events-none absolute inset-0 block h-full w-full border-none lg:pointer-events-auto lg:h-[133.3333%] lg:w-[133.3333%] lg:origin-top-left lg:scale-75"
						loading="lazy"
						src={item.src}
						title={item.title}
					/>
				</div>
			</div>
		</div>
	);
}
