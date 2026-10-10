import Catalogue from "@/components/catalogue/view/Catalogue";
import LimitsModal from "@/components/modals/LimitsModal";
import { FAVICON } from "@/constants";
import { generateCatalogueMetadata } from "@/constants/metadata";
import { htmlToText, kebabToTitle } from "@/helpers/client";
import { Catalogue as CatalogueType } from "@quicktalog/common";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

export const revalidate = 86400;

export async function generateStaticParams() {
	try {
		const res = await fetch(
			`${process.env.NEXT_PUBLIC_BASE_URL}/api/items?type=name&status=active`,
			{
				method: "GET",
				headers: { "Content-Type": "application/json" },
				next: {
					tags: ["catalogues-list"],
					revalidate: 3600,
				},
			},
		);

		if (!res.ok) {
			console.warn("Error fetching catalogues:", res.statusText);
			return [];
		}

		const data = await res.json();

		return (
			data?.map((catalogue: { name: string }) => ({
				name: catalogue.name,
			})) || []
		);
	} catch (error) {
		console.warn("generateStaticParams error:", error);
		return [];
	}
}

export async function generateMetadata({
	params,
}: {
	params: Promise<{ name: string }>;
}): Promise<Metadata> {
	try {
		const { name } = await params;

		const res = await fetch(
			`${process.env.NEXT_PUBLIC_BASE_URL}/api/items/${name}?type=meta`,
			{
				method: "GET",
				headers: { "Content-Type": "application/json" },
				next: {
					tags: [`catalogue-${name}`, "catalogue-metadata"],
					revalidate: 3600,
				},
			},
		);

		if (!res.ok) {
			return {
				title: "Catalogue Not Found | Quicktalog",
				description:
					"The service catalogue you're looking for doesn't exist or has been removed.",
			};
		}

		const data: Catalogue = await res.json();

		if (!data) {
			return {
				title: "Catalogue Not Found | Quicktalog",
				description:
					"The service catalogue you're looking for doesn't exist or has been removed.",
			};
		}
		const title =
			data.metadata.title ||
			kebabToTitle(data.name) ||
			htmlToText(data.heading);
		const description = data.metadata?.description || htmlToText(data.heading);
		const opengraphImage = data.logo || "/opengraph-image.png";
		const icon = data.metadata.icon || data.logo || FAVICON;
		return generateCatalogueMetadata(
			title,
			description,
			name,
			icon,
			opengraphImage,
		);
	} catch (error) {
		console.warn("generateMetadata error:", error);
		return {
			title: "Catalogue | Quicktalog",
			description:
				"Explore this digital service catalogue created with Quicktalog.",
		};
	}
}

const page = async ({ params }: { params: Promise<{ name: string }> }) => {
	try {
		const { name } = await params;

		if (!name) {
			throw new Error("Catalogue name is required");
		}

		const res = await fetch(
			`${process.env.NEXT_PUBLIC_BASE_URL}/api/items/${name}`,
			{
				method: "GET",
				headers: { "Content-Type": "application/json" },
				next: {
					tags: [`catalogue-${name}`, "catalogue-detail"],
				},
			},
		);

		if (!res.ok) {
			if (res.status === 404) {
				notFound();
			}
		}

		const data = await res.json();

		if (!data) {
			console.warn("No data found for the service catalogue");
		}

		const item = data as CatalogueType;

		if (!item.heading || !item.content) {
			console.warn("Invalid catalogue data:", item);
		}

		if (item.status === "active") {
			return <Catalogue item={item} type="view" />;
		} else {
			return <LimitsModal isOpen={true} type="notFound" />;
		}
	} catch (error) {
		console.warn("Catalogue page error:", error);
		return <LimitsModal isOpen={true} type="notFound" />;
	}
};

export default page;
