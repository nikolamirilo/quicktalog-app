import { ArrowRight } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { TickList } from "@/components/modals/limits/TickList";

export const NotFoundContent = () => {
	return (
		<>
			<div className="rounded-2xl border border-product-primary/40 bg-product-primary-soft p-3.5">
				<p className="mb-2.5 text-sm font-bold">
					Create Your Digital Catalogue with Quicktalog
				</p>
				<TickList
					items={[
						"Beautiful, mobile-friendly catalogs in minutes",
						"Share via QR codes and get real-time analytics",
						"No coding required - start today",
					]}
				/>
			</div>
			<Button asChild className="group mt-1 w-full">
				<Link href={process.env.NEXT_PUBLIC_BASE_URL!} target="_blank">
					Get Started Today
					<ArrowRight
						aria-hidden="true"
						className="transition-transform group-hover:translate-x-0.5"
					/>
				</Link>
			</Button>
		</>
	);
};
