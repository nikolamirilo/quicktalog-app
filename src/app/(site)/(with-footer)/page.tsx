import type { Metadata } from "next";

import { CreateCatalogueProvider } from "@/components/catalogue/create/CreateCatalogueProvider";
import { DemoVideo } from "@/components/demo/DemoVideo";
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
import { YOUTUBE_DEMO_URL } from "@/constants/marketing";
import { generatePageMetadata } from "@/constants/metadata";
import { getPageSchema } from "@/constants/schemas";
import { getServerPrices } from "@/lib/paddle/prices";

export const metadata: Metadata = generatePageMetadata("home");

const page = async () => {
	// Rendered into the HTML, so link previews, crawlers and AI search see real
	// prices instead of the dash Paddle.js leaves until it has run.
	const prices = await getServerPrices();
	const homePageSchema = getPageSchema("home", prices);
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
					description="Replace printed catalogues with an interactive, mobile-friendly online catalogue you can update in real time."
					id="problems"
					title="Stop Losing Customers to Outdated Catalogues"
				>
					<ProblemSection />
				</Section>

				<Section
					containerClassName="px-0"
					description="Create a professional digital catalogue with our free online catalogue maker in a few simple steps, or let AI generate it for you. No design or code required."
					id="how-it-works"
					title="Go Live in Minutes"
				>
					<HowItWorks />
				</Section>

				<AiShortcut />

				{YOUTUBE_DEMO_URL && (
					<Section
						className="pt-0 lg:pt-0"
						containerClassName="px-0"
						description="A short walkthrough: an empty page to a published catalogue with its own link and QR code."
						id="demo-video"
						title="See Quicktalog in Action"
					>
						<DemoVideo />
					</Section>
				)}

				<Section
					className="pt-0 lg:pt-0"
					containerClassName="px-0"
					description="Start with our free online catalogue maker and upgrade as you grow. No hidden fees. Access professional catalogue templates, AI generation, OCR import, and analytics on higher tiers."
					id="pricing"
					title="Simple, Transparent Pricing"
				>
					<Pricing initialPrices={prices} />
				</Section>

				<CTA />

				<Section
					containerClassName="px-0"
					description="Learn how digital catalogues differ from websites, how updates work, and how AI/OCR help you launch faster."
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
