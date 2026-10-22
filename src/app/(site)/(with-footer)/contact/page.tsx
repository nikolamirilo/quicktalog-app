import type { Metadata } from "next";
import { Suspense } from "react";

import { Contact } from "@/components/contact/Contact";
import { PageHero } from "@/components/general/PageHero";
import { generatePageMetadata } from "@/constants/metadata";
import { getPageSchema } from "@/constants/schemas";

export const metadata: Metadata = generatePageMetadata("contact");

const page = () => {
	const contactPageSchema = getPageSchema("contact");

	return (
		<>
			<script
				dangerouslySetInnerHTML={{ __html: JSON.stringify(contactPageSchema) }}
				type="application/ld+json"
			/>
			<PageHero
				eyebrow="Contact"
				lead="Questions about plans, a custom setup or something in the builder? Send us a message and we'll usually reply within 1 business day."
				short
				title="Contact Quicktalog"
			/>
			{/* Contact reads ?subject= via useSearchParams, which needs a Suspense boundary to stay statically prerendered. */}
			<Suspense>
				<Contact />
			</Suspense>
		</>
	);
};

export default page;
