import { Metadata } from "next";
import Pricing from "@/components/home/Pricing/Pricing";
import Section from "@/components/home/Section";
import Footer from "@/components/navigation/Footer";
import Navbar from "@/components/navigation/Navbar";
import { generatePageMetadata } from "@/constants/metadata";
import { getPageSchema } from "@/constants/schemas";

export const metadata: Metadata = generatePageMetadata("pricing");

const page = () => {
	const pricingPageSchema = getPageSchema("pricing");

	return (
		<div className="font-lora">
			<script
				dangerouslySetInnerHTML={{ __html: JSON.stringify(pricingPageSchema) }}
				type="application/ld+json"
			/>
			<Navbar />
			<div className="mx-auto h-fit flex flex-col items-center justify-center py-24 max-w-[1400px]">
				<Section
					description="Choose the plan that's right for you. No hidden fees, no surprises. Start for free and upgrade as you grow."
					id="pricing"
					title="Simple, Transparent Pricing"
				>
					<Pricing />
				</Section>
			</div>
			<Footer />
		</div>
	);
};

export default page;
