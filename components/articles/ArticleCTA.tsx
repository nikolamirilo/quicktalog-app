import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles, Zap } from "lucide-react";
import Link from "next/link";

interface Props {
	variant?: "mid" | "end";
	heading?: string;
	body?: string;
}

const defaults = {
	mid: {
		heading: "Publish your own digital menu in minutes",
		body: "Create an interactive catalog, preview it instantly on mobile, and launch without writing a single line of code.",
	},
	end: {
		heading: "Launch your first interactive catalog today",
		body: "Turn your menu, services, or products into a beautiful digital catalog in minutes. Free forever plan included.",
	},
};

export default function ArticleCTA({ variant = "mid", heading, body }: Props) {
	const copy = defaults[variant];
	const finalHeading = heading ?? copy.heading;
	const finalBody = body ?? copy.body;

	if (variant === "mid") {
		return (
			<aside className="my-14 overflow-hidden rounded-2xl border border-black/5 bg-gradient-to-br from-white to-neutral-50 p-6 shadow-[0_8px_30px_rgba(0,0,0,0.04)] transition-all duration-300 hover:shadow-[0_12px_40px_rgba(0,0,0,0.06)] sm:p-7">
				<div className="flex gap-5">
					<div className="flex-shrink-0">
						<div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-product-primary shadow-md">
							<Zap className="h-5 w-5 text-black" fill="currentColor" />
						</div>
					</div>

					<div className="flex-1">
						<h3 className="font-lora text-xl font-bold leading-tight text-black sm:text-2xl">
							{finalHeading}
						</h3>

						<p className="mt-2 text-sm leading-relaxed text-black/60 sm:text-base">
							{finalBody}
						</p>

						<div className="mt-5 flex flex-wrap gap-3">
							<Button
								asChild
								size="sm"
								className="bg-product-primary font-semibold text-black shadow-md transition-all duration-200 hover:scale-[1.03] hover:bg-product-primary-accent"
							>
								<Link
									className="flex items-center gap-1.5"
									href="/auth?mode=signup"
								>
									Create free catalog
									<ArrowRight className="h-4 w-4" />
								</Link>
							</Button>

							<Button
								asChild
								size="sm"
								variant="ghost"
								className="font-medium text-black/70 hover:bg-black/5 hover:text-black"
							>
								<Link href="/demo">See live demo</Link>
							</Button>
						</div>
					</div>
				</div>
			</aside>
		);
	}

	return (
		<aside className="relative mt-20 overflow-hidden rounded-3xl border border-black/5 bg-gradient-to-br from-white via-white to-amber-50 p-10 shadow-[0_20px_60px_rgba(0,0,0,0.06)] sm:p-12">
			{/* Decorative background */}
			<div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,193,7,0.18),transparent_40%)]" />

			<div className="absolute inset-0 opacity-[0.03] bg-[linear-gradient(to_right,#000_1px,transparent_1px),linear-gradient(to_bottom,#000_1px,transparent_1px)] bg-[size:32px_32px]" />

			<div className="relative z-10 max-w-2xl">
				<div className="mb-6 inline-flex items-center gap-2 rounded-full bg-black px-4 py-2">
					<Sparkles className="h-4 w-4 text-product-primary" />
					<span className="text-xs font-semibold tracking-wide text-white">
						Free forever plan available
					</span>
				</div>

				<h3 className="font-lora text-3xl font-bold leading-tight text-black sm:text-5xl">
					{finalHeading}
				</h3>

				<p className="mt-4 text-base leading-relaxed text-black/60 sm:text-lg">
					{finalBody}
				</p>

				<div className="mt-8 flex flex-wrap gap-4">
					<Button
						asChild
						size="lg"
						className="bg-product-primary px-7 font-bold text-black shadow-lg transition-all duration-200 hover:scale-[1.03] hover:bg-product-primary-accent"
					>
						<Link className="flex items-center gap-2" href="/auth?mode=signup">
							Create free catalog
							<ArrowRight className="h-4 w-4" />
						</Link>
					</Button>

					<Button
						asChild
						size="lg"
						variant="outline"
						className="border-black/10 bg-white/80 text-black/70 backdrop-blur-sm hover:bg-white hover:text-black"
					>
						<Link href="/demo">See demo</Link>
					</Button>
				</div>

				<div className="mt-6 text-sm text-black/40">
					No credit card • Free forever plan • Setup in under 2 minutes
				</div>
			</div>
		</aside>
	);
}
