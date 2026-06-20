import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface Props {
	variant?: "mid" | "end";
	heading?: string;
	body?: string;
}

const defaults = {
	mid: {
		heading: "Want to try it on your own menu?",
		body: "Spin up a catalog in minutes and see it live on a phone. The free plan is plenty to publish your first one.",
	},
	end: {
		heading: "Build your first catalog free",
		body: "Turn your menu, services, or products into an interactive digital catalog in minutes. No code, and no card required.",
	},
};

/**
 * Call to action block. Styled to match the home page MiniCTA: a warm amber
 * gradient banner with a border, soft shadow, and an amber button with navy
 * text. Two placements ("mid" in the body, "end" to close) with distinct copy.
 */
export default function ArticleCTA({ variant = "mid", heading, body }: Props) {
	const copy = defaults[variant];
	const finalHeading = heading ?? copy.heading;
	const finalBody = body ?? copy.body;

	return (
		<aside
			className={`${
				variant === "end" ? "mt-16" : "my-12"
			} relative overflow-hidden rounded-xl border border-product-border bg-gradient-to-r from-white via-product-primary/25 to-product-primary/40 p-6 shadow-md sm:p-8`}
		>
			{/* Background gradient overlay (mirrors the home MiniCTA) */}
			<div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-white/60 via-product-primary/15 to-product-primary/25" />

			<div className="relative z-10 flex flex-col items-start gap-6 sm:flex-row sm:items-center sm:justify-between">
				<div className="flex-1">
					<h3 className="font-lora text-xl font-bold text-product-foreground lg:text-2xl">
						{finalHeading}
					</h3>
					<p className="mt-2 max-w-xl text-product-foreground-accent">
						{finalBody}
					</p>
				</div>
				<div className="flex w-full flex-shrink-0 flex-wrap gap-3 sm:w-auto">
					<Button
						asChild
						className="bg-product-primary font-bold text-product-secondary shadow-sm transition-all duration-200 hover:scale-105 hover:shadow-md"
					>
						<Link
							className="flex items-center justify-center gap-2"
							href="/auth?mode=signup"
						>
							Start free
							<ArrowRight className="h-4 w-4" />
						</Link>
					</Button>
					<Button
						asChild
						className="bg-white hover:bg-product-background-hover"
						variant="outline"
					>
						<Link href="/demo">Try the demo</Link>
					</Button>
				</div>
			</div>
		</aside>
	);
}
