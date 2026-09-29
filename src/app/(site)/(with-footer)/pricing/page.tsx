import type { Metadata } from "next";
import Link from "next/link";

import { CheckList } from "@/components/general/CheckList";
import { Container } from "@/components/general/Container";
import { CtaBand } from "@/components/general/CtaBand";
import { FaqAccordion } from "@/components/general/FaqAccordion";
import { PageHero } from "@/components/general/PageHero";
import { Section } from "@/components/general/Section";
import { SignupButton } from "@/components/general/SignupButton";
import { PricingPlans } from "@/components/pricing/PricingPlans";
import { Button } from "@/components/ui/button";
import { generatePageMetadata } from "@/constants/metadata";
import { starterTier } from "@/constants/pricing";
import { pricingFaqs } from "@/constants/pricingFaqs";
import { getPageSchema } from "@/constants/schemas";

export const metadata: Metadata = generatePageMetadata("pricing");

const planBasics = [
	"No credit card to start",
	"Cancel anytime",
	"10-day money-back guarantee",
];

const page = () => {
	const pricingPageSchema = getPageSchema("pricing");

	return (
		<>
			<script
				dangerouslySetInnerHTML={{ __html: JSON.stringify(pricingPageSchema) }}
				type="application/ld+json"
			/>
			<PageHero
				eyebrow="Pricing"
				lead="Start free and upgrade as you grow. No hidden fees, no surprises, and every paid plan comes with a 10-day money-back guarantee."
				title="Simple, transparent pricing"
			>
				<CheckList
					aria-label="Plan basics"
					className="mt-6 gap-x-[22px] gap-y-2.5 text-[14.5px] font-medium text-product-foreground-accent"
					iconClassName="h-4 w-4"
					items={planBasics}
				/>
			</PageHero>

			<PricingPlans />

			<Section
				className="pt-6 lg:pt-6"
				eyebrow="Pricing FAQ"
				title="Questions about plans and billing"
			>
				<FaqAccordion items={pricingFaqs} />
			</Section>

			<Container className="pb-14 pt-6">
				<CtaBand
					actions={
						<>
							<SignupButton>Create your catalogue</SignupButton>
							<Button
								asChild
								className="w-full sm:w-auto sm:min-w-[224px]"
								size="lg"
								variant="inverse"
							>
								<Link href="/demo">Try the demo</Link>
							</Button>
						</>
					}
					checks={[
						"No credit card required",
						"Cancel anytime",
						"10-day money-back guarantee",
					]}
					description={`Publish your first catalogue in minutes on the ${starterTier.name} plan. Move to a paid plan whenever you need more room, branding or more AI credits.`}
					title="Start free. Upgrade when you're ready."
				/>
			</Container>
		</>
	);
};

export default page;
