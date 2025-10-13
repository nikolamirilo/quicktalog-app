import Container from "@/components/home/Container";
import Hero from "@/components/home/Hero";
import Section from "@/components/home/Section";
import {
	LoadingSpinner,
	SectionSkeleton,
} from "@/components/navigation/Loader";
import Navbar from "@/components/navigation/Navbar";
import { generatePageMetadata } from "@/constants/metadata";
import { getPageSchema } from "@/constants/schemas";
import { Metadata } from "next";
import { Suspense, lazy } from "react";

export const metadata: Metadata = generatePageMetadata("home");

const Benefits = lazy(() => import("@/components/home/Benefits/Benefits"));
const ProblemSection = lazy(() => import("@/components/home/ProblemSection"));
const HowItWorks = lazy(() => import("@/components/home/HowItWorks"));
const AIShortcut = lazy(() => import("@/components/home/AIShortcut"));
const Pricing = lazy(() => import("@/components/home/Pricing/Pricing"));
const CTA = lazy(() => import("@/components/home/CTA"));
const FAQ = lazy(() => import("@/components/home/FAQ"));
const Footer = lazy(() => import("@/components/navigation/Footer"));

const page: React.FC = async () => {
	const homePageSchema = getPageSchema("home");
	return (
		<div
			className="font-lora no-tap-highlight"
			style={{ WebkitTapHighlightColor: "transparent" }}
		>
			<script
				type="application/ld+json"
				dangerouslySetInnerHTML={{ __html: JSON.stringify(homePageSchema) }}
			/>
			<Navbar />
			<Hero />
			<Container>
				<Suspense fallback={<SectionSkeleton height="h-48" />}>
					<Benefits />
				</Suspense>

				<Section
					id="problems"
					title="Stop Losing Customers to Outdated Catalogs"
					description="Replace printed catalogs with an interactive, mobile-friendly online catalog you can update in real time."
				>
					<Suspense fallback={<SectionSkeleton height="h-64" />}>
						<ProblemSection />
					</Suspense>
				</Section>

				<Section
					id="how-it-works"
					title="Go Live in Minutes"
					description="Create a professional digital catalog with our free online catalog maker in a few simple steps-or let AI generate it for you. No design or code required."
				>
					<Suspense fallback={<SectionSkeleton height="h-72" />}>
						<HowItWorks />
					</Suspense>
				</Section>

				<Suspense fallback={<SectionSkeleton height="h-56" />}>
					<AIShortcut />
				</Suspense>

				<Section
					id="pricing"
					title="Simple, Transparent Pricing"
					description="Start with our free online catalog maker and upgrade as you grow. No hidden fees. Access professional catalog templates, AI generation, OCR import, and analytics on higher tiers."
				>
					<Suspense fallback={<SectionSkeleton height="h-96" />}>
						<Pricing />
					</Suspense>
				</Section>

				<Suspense fallback={<SectionSkeleton height="h-32" />}>
					<CTA />
				</Suspense>

				<Section
					id="faq"
					title="Got Questions? We've Got Answers"
					description="Learn how digital catalogs differ from websites, how updates work, and how AI/OCR help you launch faster."
				>
					<Suspense fallback={<SectionSkeleton height="h-80" />}>
						<FAQ />
					</Suspense>
				</Section>
			</Container>

			<Suspense fallback={<LoadingSpinner />}>
				<Footer />
			</Suspense>
		</div>
	);
};

export default page;
