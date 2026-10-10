import { PenLine, Share2, Smartphone } from "lucide-react";

import { Rise } from "@/components/general/Rise";
import { cn } from "@/lib/ui/cn";

const features = [
	{
		icon: PenLine,
		title: "Professional Catalogue Templates",
		description:
			"Choose from a variety of professionally designed catalog templates that look great on any device.",
	},
	{
		icon: Smartphone,
		title: "Mobile-First Design",
		description:
			"Your catalog will look amazing on smartphones, tablets, and desktops, guaranteed.",
		highlight: true,
	},
	{
		icon: Share2,
		title: "Easy Sharing",
		description:
			"Share your catalog with a simple link or QR code. No app downloads required.",
	},
];

/** "Look Professional, Build Trust": amber panel with three numbered cards. */
export function BenefitFeature() {
	return (
		<Rise
			aria-labelledby="benefit-feature-heading"
			as="section"
			className="relative isolate my-12 overflow-hidden rounded-product-panel border border-product-border bg-product-amber-panel px-5 pb-5 pt-9 md:my-16 md:px-10 md:pb-10 md:pt-12"
		>
			<div
				aria-hidden="true"
				className="absolute -right-[180px] -top-[240px] -z-10 h-[520px] w-[520px] rounded-full bg-[radial-gradient(closest-side,rgb(var(--product-primary-rgb)/0.28),transparent)]"
			/>
			<div className="mb-7 grid grid-cols-1 gap-3.5 md:mb-9 md:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] md:items-end md:gap-12">
				<h3
					className="text-balance text-[clamp(30px,3.6vw,46px)] font-extrabold leading-[1.05] tracking-[-0.03em]"
					id="benefit-feature-heading"
				>
					Look Professional, Build Trust
				</h3>
				<p className="max-w-[52ch] text-[17px] leading-[1.65] text-product-foreground-accent">
					Your catalog is often the first impression a customer has of your
					business. Make it a great one with a beautiful, mobile-friendly design
					that builds trust and drives sales.
				</p>
			</div>
			<div className="grid grid-cols-1 gap-3.5 md:grid-cols-3 md:gap-[18px]">
				{features.map(
					({ icon: Icon, title, description, highlight }, index) => (
						<article
							className={cn(
								"group relative rounded-product-card border bg-product-card px-[22px] py-6 shadow-product transition-[transform,box-shadow,border-color] duration-[250ms] hover:-translate-y-1 hover:border-product-primary/70 hover:shadow-product-hover",
								highlight
									? "border-product-primary/60 shadow-[var(--product-shadow),0_0_0_5px_rgb(var(--product-primary-rgb)/0.08)]"
									: "border-product-border",
							)}
							key={title}
						>
							<span
								aria-hidden="true"
								className="absolute right-[22px] top-5 font-product-heading text-[13px] font-extrabold tracking-[0.06em] text-product-muted"
							>
								{String(index + 1).padStart(2, "0")}
							</span>
							<span
								aria-hidden="true"
								className={cn(
									"grid h-[52px] w-[52px] place-items-center rounded-2xl border transition-colors duration-[250ms] group-hover:border-product-primary group-hover:bg-product-primary group-hover:text-product-foreground [&_svg]:size-6",
									highlight
										? "border-product-primary bg-product-primary text-product-foreground"
										: "border-product-primary/35 bg-product-primary-soft text-product-primary-ink",
								)}
							>
								<Icon />
							</span>
							<h4 className="mt-[18px] text-[19px] font-bold tracking-[-0.015em]">
								{title}
							</h4>
							<p className="mt-2 text-[15.5px] leading-[1.6] text-product-foreground-accent">
								{description}
							</p>
						</article>
					),
				)}
			</div>
		</Rise>
	);
}
