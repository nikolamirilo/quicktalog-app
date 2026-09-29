import { ArrowRight } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";

/** End-of-article author card with a short blurb and a soft call to action. */
export function AuthorBio({ author }: { author: string }) {
	return (
		<aside
			aria-label="About the author"
			className="mt-12 flex flex-col items-start gap-3.5 rounded-product-card border border-product-border bg-product-card p-[22px] shadow-product md:flex-row md:items-center"
		>
			<span
				aria-hidden="true"
				className="grid h-14 w-14 flex-none place-items-center rounded-full bg-product-primary font-product-heading text-[22px] font-extrabold leading-none text-product-foreground shadow-product-primary"
			>
				Q
			</span>
			<div className="md:flex-1">
				<small className="text-[12.5px] font-bold uppercase tracking-[0.08em] text-product-muted">
					Written by
				</small>
				<b className="mt-0.5 block font-product-heading text-lg font-extrabold leading-[1.3] text-product-foreground">
					{author}
				</b>
				<p className="mt-1.5 text-[15px] leading-[1.6] text-product-foreground-accent">
					We build Quicktalog, the fastest way to turn a menu, service list, or
					product range into an interactive digital catalog. We write about
					doing it well.
				</p>
			</div>
			<Button asChild className="group flex-none" variant="outline">
				<Link href="/auth?mode=signup">
					Try Quicktalog
					<ArrowRight
						aria-hidden="true"
						className="transition-transform group-hover:translate-x-[3px]"
					/>
				</Link>
			</Button>
		</aside>
	);
}
