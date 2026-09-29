import type { Metadata } from "next";

import { HelpCenter } from "@/components/help/HelpCenter";
import { PopularGuides } from "@/components/help/PopularGuides";
import { SupportCards } from "@/components/help/SupportCards";
import { faqs } from "@/constants/details";
import { generatePageMetadata } from "@/constants/metadata";
import { getPageSchema } from "@/constants/schemas";

export const metadata: Metadata = generatePageMetadata("help");

export default function HelpPage() {
	return (
		<>
			<script
				dangerouslySetInnerHTML={{
					__html: JSON.stringify(getPageSchema("help")),
				}}
				type="application/ld+json"
			/>
			<HelpCenter faqs={faqs} />
			<PopularGuides />
			<SupportCards />
		</>
	);
}
