import Link from "next/link";

import { Button } from "@/components/ui/button";

/** Slim "ready to start?" bar with sign-up and pricing links. */
export function GetStartedCTA() {
	return (
		<div className="mx-auto mt-7 flex max-w-[1152px] flex-col items-center gap-4 rounded-product-card border border-product-border bg-product-card px-6 py-[22px] text-center shadow-product md:flex-row md:justify-between md:px-7 md:text-left">
			<h2 className="text-[clamp(19px,2vw,22px)] font-bold leading-[1.25] tracking-[-0.02em]">
				Ready to create your own catalogue?
			</h2>
			<div className="flex flex-wrap justify-center gap-2.5">
				<Button asChild>
					<Link href="/auth?mode=signup">Get Started</Link>
				</Button>
				<Button asChild variant="outline">
					<Link href="/pricing">Pricing</Link>
				</Button>
			</div>
		</div>
	);
}
