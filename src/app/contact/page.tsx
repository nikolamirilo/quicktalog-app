import Contact from "@/components/contact/Contact";
import Navbar from "@/components/navigation/Navbar";
import { generatePageMetadata } from "@/constants/metadata";
import { getPageSchema } from "@/constants/schemas";
import type { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = generatePageMetadata("contact");

const page = () => {
	const contactPageSchema = getPageSchema("contact");

	return (
		<>
			<script
				dangerouslySetInnerHTML={{ __html: JSON.stringify(contactPageSchema) }}
				type="application/ld+json"
			/>
			<Navbar />
			{/* Contact reads ?subject= via useSearchParams, which needs a Suspense boundary to stay statically prerendered. */}
			<Suspense>
				<Contact />
			</Suspense>
		</>
	);
};

export default page;
