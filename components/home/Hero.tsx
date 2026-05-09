"use client";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import React from "react";
import {
	FiCheck,
	FiClock,
	FiDollarSign,
	FiPlay,
	FiSmartphone
} from "react-icons/fi";
import CreateCatalogueButton from "../dashboard/components/CreateCatalogueButton";

// Static data for reusability
const valuePropositions = [
	{ icon: FiClock, text: "Go live in under 5 minutes" },
	{ icon: FiSmartphone, text: "Works on any device" },
	{ icon: FiDollarSign, text: "Free online catalog maker" },
];

const trustIndicators = [
	{ icon: FiCheck, text: "No credit card required" },
	{ icon: FiCheck, text: "Start with our free plan" },
];

// Reusable component for icons with text
const IconText: React.FC<{ icon: React.ElementType; text: string }> = ({
	icon: Icon,
	text,
}) => (
	<div className="flex items-center gap-2">
		<Icon className="h-4 w-4 text-product-primary" />
		<span className="font-medium">{text}</span>
	</div>
);

const Hero: React.FC = () => {
	return (
		<section
			className="relative w-full min-h-[90vh] overflow-hidden px-4 pt-32 pb-32 md:pt-40 md:pb-40"
			id="hero"
			role="banner"
		>
			{/* Background Grid */}
			<div className="absolute inset-0 -z-10 bg-product-background-hero bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_60%,transparent_100%)]" />

			{/* Ambient color blob behind the image */}
			<div
				aria-hidden="true"
				className="pointer-events-none absolute -z-10 right-[-8%] top-1/3 h-[520px] w-[520px] rounded-full bg-product-primary/15 blur-[120px]"
			/>

			{/* Smooth bottom fade into next section */}
			<div className="pointer-events-none absolute bottom-0 left-0 right-0 h-80 bg-[linear-gradient(to_bottom,transparent_0%,rgba(233,238,255,0.2)_30%,rgba(218,224,243,0.5)_65%,rgba(202,208,230,0.8)_100%)]" />

			<div className="relative z-10 grid grid-cols-1 lg:grid-cols-[1fr_1fr] gap-8 lg:gap-10 w-full max-w-7xl mx-auto items-center">
				{/* Left: Content */}
				<div className="w-full text-center">
					<h1 className="text-4xl font-bold text-product-foreground md:text-5xl lg:text-6xl lg:leading-tight">
						Create a Stunning Digital Catalogue in Minutes
					</h1>
					<p className="mt-4 text-lg text-product-foreground-accent md:text-xl">
						The best free online catalog maker for businesses. Turn your services,
						menus, or products into an interactive, mobile-friendly digital
						catalog or price list. No code or design skills required.
					</p>

					{/* Value Propositions */}
					<div className="mt-6 flex flex-col items-center justify-center gap-4 text-sm text-product-foreground-accent sm:flex-row sm:flex-wrap">
						{valuePropositions.map(({ icon, text }, index) => (
							<IconText icon={icon} key={`value-${index}`} text={text} />
						))}
					</div>

					{/* CTA Buttons */}
					<div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
						<CreateCatalogueButton type="home" />
						<Link href="/demo">
							<Button
								aria-label="Try the catalog demo"
								className="h-14 border-2 border-product-primary px-8 py-4 text-lg text-wrap min-w-56 w-fit"
								variant="outline"
							>
								<FiPlay className="mr-2 h-5 w-5" />
								Try Demo
							</Button>
						</Link>
					</div>

					{/* Trust Indicators */}
					<div className="mt-6 flex flex-wrap items-center justify-center gap-6 text-sm text-product-foreground-accent">
						{trustIndicators.map(({ icon, text }, index) => (
							<IconText icon={icon} key={`trust-${index}`} text={text} />
						))}
					</div>
				</div>

				{/* Right: Image */}
				<div className="relative w-full flex justify-center lg:justify-end">
					{/* Soft glow halo directly behind the image */}
					<div
						aria-hidden="true"
						className="pointer-events-none absolute inset-0 flex items-center justify-center"
					>
						<div className="h-[75%] w-[75%] rounded-full bg-product-primary/25 blur-[90px]" />
					</div>

					<img
						alt="Interactive digital catalog"
						className="relative z-10 w-full max-w-xl lg:max-w-2xl xl:max-w-3xl h-auto drop-shadow-2xl lg:-mr-10 xl:-mr-20"
						fetchPriority="high"
						height={340 * 1.6}
						sizes="(max-width: 1024px) 90vw, 900px"
						src="/images/hero.png"
					/>
				</div>
			</div>
		</section>
	);
};

export default React.memo(Hero);