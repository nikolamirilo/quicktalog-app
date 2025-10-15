import FAQ from "@/components/home/FAQ";
import Section from "@/components/home/Section";
import Footer from "@/components/navigation/Footer";
import Navbar from "@/components/navigation/Navbar";
import { generatePageMetadata } from "@/constants/metadata";
import { getPageSchema } from "@/constants/schemas";
import { Metadata } from "next";

export const metadata: Metadata = generatePageMetadata("help");

const page = () => {
	const helpPageSchema = getPageSchema("help");

	return (
		<div className="font-lora">
			<script
				type="application/ld+json"
				dangerouslySetInnerHTML={{ __html: JSON.stringify(helpPageSchema) }}
			/>
			<Navbar />
			<div className="mx-auto h-fit flex flex-col items-center justify-center py-24 max-w-[1400px]">
				<Section
					id="help"
					title="Help Center & FAQs"
					description="Find answers to common questions, step-by-step guides, and resources to get the most out of Quicktalog."
				>
					<FAQ />
				</Section>
			</div>
			<Footer />
		</div>
	);
};

export default page;
