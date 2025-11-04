import { Catalogue } from "@quicktalog/common";
import { MetadataRoute } from "next";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
	const baseUrl = process.env.NEXT_PUBLIC_BASE_URL!;

	let catalogues: Catalogue[] = [];
	try {
		const res = await fetch(`${baseUrl}/api/items`, {
			method: "GET",
			cache: "force-cache",
		});

		if (res.ok) {
			catalogues = await res.json();
		}
	} catch (err) {
		console.error("Error fetching catalogues:", err);
	}

	const hasCatalogues = Array.isArray(catalogues) && catalogues.length > 0;

	const staticUrls: MetadataRoute.Sitemap = [
		{
			url: `${baseUrl}`,
			lastModified: new Date(),
			changeFrequency: "monthly",
			priority: 1,
		},
		{
			url: `${baseUrl}/pricing`,
			lastModified: new Date(),
			changeFrequency: "monthly",
			priority: 0.8,
		},
		{
			url: `${baseUrl}/auth`,
			lastModified: new Date(),
			changeFrequency: "monthly",
			priority: 0.8,
		},
		{
			url: `${baseUrl}/demo`,
			lastModified: new Date(),
			changeFrequency: "monthly",
			priority: 0.8,
		},
		{
			url: `${baseUrl}/contact`,
			lastModified: new Date(),
			changeFrequency: "monthly",
			priority: 0.7,
		},
		{
			url: `${baseUrl}/auth?mode=signup`,
			lastModified: new Date(),
			changeFrequency: "monthly",
			priority: 0.5,
		},
		{
			url: `${baseUrl}/privacy-policy`,
			lastModified: new Date(),
			changeFrequency: "monthly",
			priority: 0.4,
		},
		{
			url: `${baseUrl}/refund-policy`,
			lastModified: new Date(),
			changeFrequency: "monthly",
			priority: 0.4,
		},
		{
			url: `${baseUrl}/terms-and-conditions`,
			lastModified: new Date(),
			changeFrequency: "monthly",
			priority: 0.4,
		},
		{
			url: `${baseUrl}/help`,
			lastModified: new Date(),
			changeFrequency: "monthly",
			priority: 0.3,
		},
	];

	const catalogueUrls: MetadataRoute.Sitemap = hasCatalogues
		? catalogues.map((catalogue) => ({
				url: `${baseUrl}/catalogues/${catalogue.name}`,
				lastModified: new Date(),
				changeFrequency: "monthly",
				priority: 0.9,
			}))
		: [];

	return [...staticUrls, ...catalogueUrls];
}
