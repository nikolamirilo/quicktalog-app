import ContentContainer from "@/components/home/ContentContainer";
import Demo from "@/components/home/Demo";
import Hero from "@/components/home/Hero";
import SectionWrapper from "@/components/home/SectionWrapper";
import {
	LoadingSpinner,
	SectionSkeleton,
} from "@/components/navigation/Loader";
import Navbar from "@/components/navigation/Navbar";
import { generatePageMetadata } from "@/constants/metadata";
import { getPageSchema } from "@/constants/schemas";
import { Metadata } from "next";
import { lazy, Suspense } from "react";

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
				dangerouslySetInnerHTML={{ __html: JSON.stringify(homePageSchema) }}
				type="application/ld+json"
			/>
			<Navbar />
			<Hero />
			<ContentContainer>
				<SectionWrapper
					description="Explore our interactive demo and see how Quicktalog turns your product catalog into a dynamic, mobile-friendly experience that boosts sales and customer engagement."
					id="demo"
					title="See it in Action"
				>
					<Suspense fallback={<SectionSkeleton height="h-64" />}>
						<Demo />
					</Suspense>
				</SectionWrapper>

				<Suspense fallback={<SectionSkeleton height="h-48" />}>
					<Benefits />
				</Suspense>

				<SectionWrapper
					description="Replace printed catalogs with an interactive, mobile-friendly online catalog you can update in real time."
					id="problems"
					title="Stop Losing Customers to Outdated Catalogs"
				>
					<Suspense fallback={<SectionSkeleton height="h-64" />}>
						<ProblemSection />
					</Suspense>
				</SectionWrapper>

				<SectionWrapper
					description="Create a professional digital catalog with our free online catalog maker in a few simple steps-or let AI generate it for you. No design or code required."
					id="how-it-works"
					title="Go Live in Minutes"
				>
					<Suspense fallback={<SectionSkeleton height="h-72" />}>
						<HowItWorks />
					</Suspense>
				</SectionWrapper>

				<Suspense fallback={<SectionSkeleton height="h-56" />}>
					<AIShortcut />
				</Suspense>

				<SectionWrapper
					description="Start with our free online catalog maker and upgrade as you grow. No hidden fees. Access professional catalog templates, AI generation, OCR import, and analytics on higher tiers."
					id="pricing"
					title="Simple, Transparent Pricing"
				>
					<Suspense fallback={<SectionSkeleton height="h-96" />}>
						<Pricing />
					</Suspense>
				</SectionWrapper>

				<Suspense fallback={<SectionSkeleton height="h-32" />}>
					<CTA />
				</Suspense>

				<SectionWrapper
					description="Learn how digital catalogs differ from websites, how updates work, and how AI/OCR help you launch faster."
					id="faq"
					title="Got Questions? We've Got Answers"
				>
					<Suspense fallback={<SectionSkeleton height="h-80" />}>
						<FAQ />
					</Suspense>
				</SectionWrapper>
			</ContentContainer>

			<Suspense fallback={<LoadingSpinner />}>
				<Footer />
			</Suspense>
		</div>
	);
};

export default page;
