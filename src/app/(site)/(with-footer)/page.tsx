import type { Metadata } from "next";

import { CreateCatalogueProvider } from "@/components/catalogue/create/CreateCatalogueProvider";
import { Container } from "@/components/general/Container";
import { Section } from "@/components/general/Section";
import { AiShortcut } from "@/components/home/ai/AiShortcut";
import { Benefits } from "@/components/home/Benefits/Benefits";
import { CTA } from "@/components/home/CTA";
import { FAQ } from "@/components/home/FAQ";
import { Hero } from "@/components/home/Hero";
import { HowItWorks } from "@/components/home/HowItWorks";
import { Pricing } from "@/components/home/Pricing";
import { ProblemSection } from "@/components/home/problems/ProblemSection";
import { generatePageMetadata } from "@/constants/metadata";
import { getPageSchema } from "@/constants/schemas";

export const metadata: Metadata = generatePageMetadata("home");

const page = () => {
	const homePageSchema = getPageSchema("home");
	return (
		// One provider for the page, so both create buttons share one set of dialogs.
		<CreateCatalogueProvider>
			<script
				dangerouslySetInnerHTML={{ __html: JSON.stringify(homePageSchema) }}
				type="application/ld+json"
			/>
			<Hero />
			<Container>
				<Benefits />

				<Section
					containerClassName="px-0"
					description="Replace printed catalogs with an interactive, mobile-friendly online catalog you can update in real time."
					id="problems"
					title="Stop Losing Customers to Outdated Catalogs"
				>
					<ProblemSection />
				</Section>

				<Section
					containerClassName="px-0"
					description="Create a professional digital catalog with our free online catalog maker in a few simple steps, or let AI generate it for you. No design or code required."
					id="how-it-works"
					title="Go Live in Minutes"
				>
					<HowItWorks />
				</Section>

				<AiShortcut />

				<Section
					className="pt-0 lg:pt-0"
					containerClassName="px-0"
					description="Start with our free online catalog maker and upgrade as you grow. No hidden fees. Access professional catalog templates, AI generation, OCR import, and analytics on higher tiers."
					id="pricing"
					title="Simple, Transparent Pricing"
				>
					<Pricing />
				</Section>

				<CTA />

				<Section
					containerClassName="px-0"
					description="Learn how digital catalogs differ from websites, how updates work, and how AI/OCR help you launch faster."
					id="faq"
					title="Got Questions? We've Got Answers"
				>
					<FAQ />
				</Section>
			</Container>
		</CreateCatalogueProvider>
	);
};

export default page;
