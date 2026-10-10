import Contact from "@/components/contact/Contact";
import Navbar from "@/components/navigation/Navbar";
import { generatePageMetadata } from "@/constants/metadata";
import { getPageSchema } from "@/constants/schemas";
import type { Metadata } from "next";

export const metadata: Metadata = generatePageMetadata("contact");

const page = () => {
	const contactPageSchema = getPageSchema("contact");

	return (
		<>
			<script
				type="application/ld+json"
				dangerouslySetInnerHTML={{ __html: JSON.stringify(contactPageSchema) }}
			/>
			<Navbar />
			<Contact />
		</>
	);
};

export default page;
