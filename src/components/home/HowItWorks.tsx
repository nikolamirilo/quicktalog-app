import { Check } from "lucide-react";

import { CheckList } from "@/components/general/CheckList";
import { Rise } from "@/components/general/Rise";
import { SignupButton } from "@/components/general/SignupButton";
import { signupAssurances } from "@/constants/marketing";

const steps = [
	{
		title: "Register",
		chip: "Free · no credit card",
		description:
			"Create an account and provide more information about your business.",
		image: "/images/marketing/step-register.svg",
	},
	{
		title: "Build your catalogue",
		chip: "By hand or with AI",
		description:
			"Create categories and add services or products with pricing to build your professional price list.",
		image: "/images/marketing/step-build.svg",
	},
	{
		title: "Publish & share",
		chip: "Link, QR code or embed",
		description: "Go live and share your catalogue with the world!",
		image: "/images/marketing/step-publish.svg",
	},
];

/** The three steps to a published catalogue, with the sign-up CTA below. */
export function HowItWorks() {
	return (
		<>
			<ol className="grid grid-cols-1 gap-7 min-[900px]:grid-cols-3">
				{steps.map((step, index) => (
					<Rise
						as="li"
						className="group h-full rounded-product-card border border-product-border bg-product-card shadow-product transition-[transform,box-shadow] duration-300 hover:-translate-y-1 hover:shadow-product-hover"
						delay={index * 90}
						key={step.title}
					>
						<div className="aspect-[4/3] overflow-hidden rounded-t-product-card border-b border-product-border bg-product-amber-glow">
							<img
								alt=""
								className="h-full w-full object-contain p-3.5 transition-transform [transition-duration:400ms] group-hover:scale-[1.04]"
								loading="lazy"
								src={step.image}
							/>
						</div>
						<div className="px-6 pb-[26px] pt-[22px]">
							<h3 className="text-[19px] font-bold tracking-[-0.015em]">
								{`${index + 1}. ${step.title}`}
							</h3>
							<span className="mt-2.5 inline-flex items-center gap-1.5 rounded-full border border-product-primary/35 bg-product-primary-soft px-[11px] py-[5px] text-[13px] font-semibold text-product-primary-ink">
								<Check aria-hidden="true" className="h-[13px] w-[13px]" />
								{step.chip}
							</span>
							<p className="mt-2.5 text-[15px] text-product-foreground-accent">
								{step.description}
							</p>
						</div>
					</Rise>
				))}
			</ol>
			<Rise className="mt-10 flex flex-col items-center gap-3.5 text-center">
				<SignupButton />
				<CheckList items={signupAssurances} />
			</Rise>
		</>
	);
}
