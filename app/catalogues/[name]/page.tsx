import type { Catalogue } from "@quicktalog/common";
import { themes } from "@quicktalog/common";
import type { Metadata } from "next";
import dynamic from "next/dynamic";
import { notFound } from "next/navigation";
import HtmlContent from "@/components/common/HtmlContent";
import Overlay from "@/components/common/Overlay";
import LimitsModal from "@/components/modals/LimitsModal";
import CatalogueFooter from "@/components/navigation/CatalogueFooter";
import CatalogueHeader from "@/components/navigation/CatalogueHeader";
import CatalogueContent from "@/components/sections/CatalogueContent";
import { generateCatalogueMetadata } from "@/constants/metadata";
import { buildFooterData, buildHeaderData } from "@/helpers/client";

export const revalidate = 86400;

export async function generateStaticParams() {
	try {
		const res = await fetch(
			`${process.env.NEXT_PUBLIC_BASE_URL}/api/items?type=name`,
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

		const data = await res.json();

		if (!data) {
			return {
				title: "Catalogue Not Found | Quicktalog",
				description:
					"The service catalogue you're looking for doesn't exist or has been removed.",
			};
		}

		return generateCatalogueMetadata(data.title, data.subtitle, name);
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
			throw new Error("Service catalogue name is required");
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

		const item = data as Catalogue;

		if (!item.title || !item.services) {
			console.warn("Invalid service catalogue data:", item);
		}

		const isEmpty = (value: unknown): boolean => {
			if (value === null || value === undefined) return true;
			if (Array.isArray(value)) return value.length === 0;
			if (typeof value === "object") return Object.keys(value).length === 0;
			if (typeof value === "string") return value.trim().length === 0;
			return false;
		};

		const isFreePlan =
			isEmpty(item.partners) &&
			isEmpty(item.configuration) &&
			isEmpty(item.legal) &&
			isEmpty(item.logo) &&
			isEmpty(item.contact);

		if (item.status === "active") {
			const headerData = isFreePlan ? undefined : buildHeaderData(item);
			const footerData = isFreePlan ? undefined : buildFooterData(item);

			// const catalogueSchema = generateCatalogueSchema(item)

			return (
				<div
					aria-label={`${item.title} Catalogue`}
					className={`${item.theme || "theme-elegant"} bg-background text-foreground min-h-screen flex flex-col`}
					role="application"
				>
					{item.theme.includes("advent") && (
						<Overlay
							emoji={
								item.theme === "theme-advent-1"
									? "❄️"
									: item.theme === "theme-advent-2"
										? "🎁"
										: ""
							}
						/>
					)}
					{/* <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(catalogueSchema) }}
          /> */}

					{isFreePlan ? (
						<CatalogueHeader
							logo={
								themes.some(
									(theme) => theme.key === item.theme && theme.type === "dark",
								)
									? "/logo-light.svg"
									: "/logo.svg"
							}
							type="default"
						/>
					) : (
						<CatalogueHeader
							data={headerData}
							logo={
								item.logo
									? item.logo
									: themes.some(
												(theme) =>
													theme.key === item.theme && theme.type === "dark",
											)
										? "/logo-light.svg"
										: "/logo.svg"
							}
							type="custom"
						/>
					)}

					<main
						aria-label="Service catalogue content"
						className="flex-1 flex flex-col min-h-0"
					>
						<section
							aria-labelledby={item.title}
							className="flex flex-col justify-start items-center text-center px-4 pt-8 sm:pt-12 md:pt-16 flex-shrink-0"
						>
							<div className="max-w-4xl mx-auto">
								<h1
									className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-lora font-semibold text-heading drop-shadow-sm mb-4"
									id={item.title}
								>
									{item.title}
								</h1>
								{item.subtitle && (
									<HtmlContent
										aria-describedby={item.title}
										className="text-text !text-center text-base sm:text-lg md:text-xl lg:text-2xl px-5 max-w-[900px] font-lora font-normal leading-relaxed"
										html={item.subtitle}
									/>
								)}
							</div>
						</section>

						{/* Services Section */}
						<section
							aria-label="Services and items"
							className="flex-1 w-full max-w-7xl mx-auto lg:px-8 pt-8 sm:pt-8 lg:pt-10 pb-8 min-h-[60vh]"
						>
							<CatalogueContent
								currency={item.currency}
								data={item.services}
								theme={item.theme}
								type="item"
							/>
						</section>
					</main>

					{/* Conditional Footer rendering */}
					{isFreePlan ? (
						<CatalogueFooter
							logo={
								themes.some(
									(theme) => theme.key === item.theme && theme.type === "dark",
								)
									? "/logo-light.svg"
									: "/logo.svg"
							}
							type="default"
						/>
					) : (
						<CatalogueFooter
							data={footerData}
							logo={
								item.logo
									? item.logo
									: themes.some(
												(theme) =>
													theme.key === item.theme && theme.type === "dark",
											)
										? "/logo-light.svg"
										: "/logo.svg"
							}
							type="custom"
						/>
					)}
				</div>
			);
		} else {
			return <LimitsModal isOpen={true} type="notFound" />;
		}
	} catch (error) {
		console.warn("Service catalogue page error:", error);
		return <LimitsModal isOpen={true} type="notFound" />;
	}
};

export default page;
