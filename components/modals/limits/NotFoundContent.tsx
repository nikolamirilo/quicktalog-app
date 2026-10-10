import { Sparkles, TrendingUp, Zap } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const NotFoundContent = () => {
	return (
		<div className="space-y-6">
			{/* Quicktalog Promotional Content */}
			<div className="p-4 sm:p-5 rounded-xl bg-product-background-hover border border-product-border">
				<h3 className="text-base sm:text-lg font-semibold text-product-foreground mb-2">
					Create Your Digital Catalogue with Quicktalog
				</h3>
				<ul className="space-y-2 text-sm text-product-foreground-accent">
					<li className="flex items-start">
						<Sparkles className="w-4 h-4 mr-2 mt-0.5 text-product-primary flex-shrink-0" />
						<span>Beautiful, mobile-friendly catalogs in minutes</span>
					</li>
					<li className="flex items-start">
						<Zap className="w-4 h-4 mr-2 mt-0.5 text-product-primary flex-shrink-0" />
						<span>Share via QR codes and get real-time analytics</span>
					</li>
					<li className="flex items-start">
						<TrendingUp className="w-4 h-4 mr-2 mt-0.5 text-product-primary flex-shrink-0" />
						<span>No coding required - start today</span>
					</li>
				</ul>
			</div>
			<Button className="w-full h-12 text-base font-semibold" variant="cta">
				<Link href={process.env.NEXT_PUBLIC_BASE_URL!} target="_blank">
					Get Started Today
				</Link>
			</Button>
		</div>
	);
};

export default NotFoundContent;
