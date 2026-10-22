import type { Metadata } from "next";

import { PageHero } from "@/components/general/PageHero";
import { Showcases } from "@/components/showcases/Showcases";
import { showcases } from "@/constants/marketing";
import { generatePageMetadata } from "@/constants/metadata";

export const metadata: Metadata = generatePageMetadata("showcases");

const page = () => {
	return (
		<>
			<PageHero
				lead="Discover how businesses across industries are using Quicktalog to create stunning digital catalogs. From fashion boutiques to electronics stores, see the possibilities for your own catalog."
				short
				title="Explore Real Catalogue Examples"
			/>
			<Showcases data={showcases} />
		</>
	);
};

export default page;
