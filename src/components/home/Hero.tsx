import { Clock, DollarSign, Play, Smartphone, Zap } from "lucide-react";
import Link from "next/link";

import { CreateCatalogueButton } from "@/components/catalogue/create/CreateCatalogueButton";
import { CheckList } from "@/components/general/CheckList";
import { HeroBackdrop, HeroKicker } from "@/components/general/PageHero";
import { Button } from "@/components/ui/button";
import { signupAssurances } from "@/constants/marketing";

/**
 * The hero is the LCP element, and `images.unoptimized` is on outside localhost,
 * so the widths exist as files built by `npm run images:hero`. Width and height
 * are the trimmed source's, so the reserved box is the shape that arrives.
 */
const HERO_WIDTHS = [760, 1100, 1520] as const;
const HERO_SIZES = "(min-width: 1024px) 760px, calc(100vw - 40px)";
const heroSrcSet = (format: "avif" | "webp") =>
	HERO_WIDTHS.map((w) => `/images/marketing/hero-${w}.${format} ${w}w`).join(
		", ",
	);

const valuePropositions = [
	{ icon: Clock, text: "Go live in under 5 minutes" },
	{ icon: Smartphone, text: "Works on any device" },
	{ icon: DollarSign, text: "Free online catalogue maker" },
];

export function Hero() {
	return (
		<section
			aria-label="Hero"
			className="relative isolate flex min-h-[90vh] items-center overflow-hidden px-5 pb-10 pt-32 lg:pb-14 lg:pt-[150px]"
			id="hero"
		>
			{/* React hoists this to <head>, so the fetch starts before the hero parses. */}
			<link
				as="image"
				fetchPriority="high"
				href="/images/marketing/hero-1100.avif"
				imageSizes={HERO_SIZES}
				imageSrcSet={heroSrcSet("avif")}
				rel="preload"
				type="image/avif"
			/>
			<HeroBackdrop />
			<div className="mx-auto grid w-full max-w-[1280px] grid-cols-1 items-center gap-10 lg:grid-cols-2">
				<div className="text-center">
					<HeroKicker icon={<Zap aria-hidden="true" />}>
						Easy. Quick. Affordable. Everywhere.
					</HeroKicker>
					<h1 className="text-balance text-display-xl">
						Create a Stunning Digital Catalogue in Minutes
					</h1>
					<p className="mx-auto mt-5 max-w-[620px] text-lead text-product-foreground-accent">
						The best free online catalogue maker for businesses. Turn your
						services, menus, or products into an interactive, mobile-friendly
						digital catalogue or price list. No code or design skills required.
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
					<picture>
						<source
							sizes={HERO_SIZES}
							srcSet={heroSrcSet("avif")}
							type="image/avif"
						/>
						<source
							sizes={HERO_SIZES}
							srcSet={heroSrcSet("webp")}
							type="image/webp"
						/>
						<img
							alt="A Quicktalog coffee menu on a phone, beside the same catalogue open in the builder on a laptop"
							className="relative w-full max-w-[720px] drop-shadow-[0_30px_40px_rgb(var(--product-foreground-rgb)/0.18)] lg:-mr-10 lg:max-w-[760px] xl:-mr-20"
							decoding="async"
							fetchPriority="high"
							height={2099}
							sizes={HERO_SIZES}
							src="/images/marketing/hero-1100.webp"
							srcSet={heroSrcSet("webp")}
							width={3019}
						/>
					</picture>
				</div>
			</div>
		</section>
	);
}
