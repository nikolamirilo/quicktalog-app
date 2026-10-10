import { Clock, DollarSign, Play, Smartphone, Zap } from "lucide-react";
import Link from "next/link";

import { CreateCatalogueButton } from "@/components/catalogue/create/CreateCatalogueButton";
import { CheckList } from "@/components/general/CheckList";
import { LottiePlayer } from "@/components/general/LottiePlayer";
import { HeroBackdrop, HeroKicker } from "@/components/general/PageHero";
import { Button } from "@/components/ui/button";
import { signupAssurances } from "@/constants/marketing";

const valuePropositions = [
	{ icon: Clock, text: "Go live in under 5 minutes" },
	{ icon: Smartphone, text: "Works on any device" },
	{ icon: DollarSign, text: "Free online catalog maker" },
];

export function Hero() {
	return (
		<section
			aria-label="Hero"
			className="relative isolate flex min-h-[90vh] items-center overflow-hidden px-5 pb-10 pt-32 lg:pb-14 lg:pt-[150px]"
			id="hero"
		>
			<HeroBackdrop />
			<div className="mx-auto grid w-full max-w-[1280px] grid-cols-1 items-center gap-10 lg:grid-cols-2">
				<div className="text-center">
					<HeroKicker
						icon={
							<LottiePlayer
								animation="sparkle"
								className="h-4 w-4"
								fallback={<Zap />}
								restFrame={30}
							/>
						}
					>
						Easy. Quick. Affordable. Everywhere.
					</HeroKicker>
					<h1 className="text-balance text-display-xl">
						Create a Stunning Digital Catalogue in Minutes
					</h1>
					<p className="mx-auto mt-5 max-w-[620px] text-lead text-product-foreground-accent">
						The best free online catalog maker for businesses. Turn your
						services, menus, or products into an interactive, mobile-friendly
						digital catalog or price list. No code or design skills required.
					</p>

					<ul className="mt-[26px] flex flex-col items-center justify-center gap-x-6 gap-y-3 text-[14.5px] font-medium text-product-foreground-accent sm:flex-row sm:flex-wrap">
						{valuePropositions.map(({ icon: Icon, text }) => (
							<li className="flex items-center gap-2" key={text}>
								<Icon
									aria-hidden="true"
									className="h-4 w-4 text-product-primary-ink"
								/>
								{text}
							</li>
						))}
					</ul>

					<div className="mt-8 flex flex-col items-center justify-center gap-3.5 sm:flex-row">
						<CreateCatalogueButton size="hero" />
						<Button
							asChild
							className="min-w-[200px] sm:min-w-56"
							size="lg"
							variant="outline"
						>
							<Link href="/demo">
								<Play aria-hidden="true" />
								Try Demo
							</Link>
						</Button>
					</div>

					<CheckList
						className="mt-6 items-center gap-x-6 gap-y-2.5 font-medium text-product-foreground-accent"
						iconClassName="h-4 w-4"
						items={signupAssurances}
					/>
				</div>

				<div className="relative flex justify-center lg:justify-end">
					<div
						aria-hidden="true"
						className="pointer-events-none absolute inset-[12%] rounded-full bg-product-primary/[0.26] blur-[80px]"
					/>
					<img
						alt="Interactive digital catalog"
						className="relative w-full max-w-[720px] drop-shadow-[0_30px_40px_rgb(var(--product-foreground-rgb)/0.18)] lg:-mr-10 lg:max-w-[760px] xl:-mr-20"
						fetchPriority="high"
						height={768}
						src="/images/marketing/hero.webp"
						width={1100}
					/>
				</div>
			</div>
		</section>
	);
}
