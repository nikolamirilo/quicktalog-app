import { ArrowRight } from "lucide-react";
import Link from "next/link";

/** End-of-article author card with a short blurb and a soft call to action. */
export default function AuthorBio({ author }: { author: string }) {
	const initial = author.trim().charAt(0).toUpperCase();

	return (
		<aside className="mt-16 flex flex-col items-start gap-5 rounded-2xl border border-product-border bg-product-background-hero p-6 sm:flex-row sm:items-center sm:p-8">
			<span
				aria-hidden
				className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-full bg-product-secondary font-lora-semibold text-xl font-bold text-white"
			>
				{initial}
			</span>
			<div className="flex-1">
				<p className="text-xs font-semibold uppercase tracking-[0.2em] text-product-secondary">
					Written by
				</p>
				<p className="mt-1 font-lora text-lg font-bold text-product-foreground">
					{author}
				</p>
				<p className="mt-1 text-product-foreground-accent">
					We build Quicktalog, the fastest way to turn a menu, service list, or
					product range into an interactive digital catalog. We write about
					doing it well.
				</p>
			</div>
			<Link
				className="inline-flex flex-shrink-0 items-center gap-1.5 font-semibold text-product-secondary transition-all hover:gap-2.5"
				href="/auth?mode=signup"
			>
				Try Quicktalog <ArrowRight className="h-4 w-4" />
			</Link>
		</aside>
	);
}
