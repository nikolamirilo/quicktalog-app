import { ArrowRight, Zap } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";

interface Props {
	heading?: string;
	body?: string;
}

/** Amber call-to-action strip placed inside article and doc bodies. */
export function ArticleCTA({
	heading = "Publish your own digital catalog in minutes",
	body = "Create an interactive catalog, preview it instantly on mobile, and launch without writing a single line of code.",
}: Props) {
	return (
		<aside
			aria-label="Try Quicktalog"
			className="relative !my-9 flex flex-col gap-4 overflow-hidden rounded-product-card border border-product-primary/45 bg-product-amber-strip px-[22px] py-6 shadow-product"
		>
			<span
				aria-hidden="true"
				className="grid h-11 w-11 place-items-center rounded-[14px] bg-product-primary text-product-foreground shadow-product-primary"
			>
				<Zap className="h-5 w-5" />
			</span>
			<div>
				<p className="font-product-heading text-[clamp(19px,2vw,22px)] font-extrabold leading-[1.25] tracking-[-0.02em] text-product-foreground">
					{heading}
				</p>
				<p className="mt-1.5 text-[15.5px] leading-[1.6] text-product-foreground-accent">
					{body}
				</p>
			</div>
			<div className="flex flex-wrap gap-2.5">
				<Button asChild className="group w-full min-[480px]:w-auto">
					<Link href="/auth?mode=signup">
						Create free catalog
						<ArrowRight
							aria-hidden="true"
							className="transition-transform group-hover:translate-x-[3px]"
						/>
					</Link>
				</Button>
				<Button asChild className="w-full min-[480px]:w-auto" variant="outline">
					<Link href="/demo">See live demo</Link>
				</Button>
			</div>
		</aside>
	);
}
