"use client";
import AppearanceOptions from "@/components/general/AppearanceOptions";
import LimitsModal from "@/components/modals/LimitsModal";
import {
	contentFontSizeMap,
	fontFamilyMap,
	shadowMap,
	titleFontSizeMap,
} from "@/constants/builder";
import { useCatalogueContext } from "@/context/CatalogueContext";
import { htmlToText } from "@/helpers/client";
import type { Catalogue, ContentBlock, UserData } from "@quicktalog/common";
import { themes, tiers } from "@quicktalog/common";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import Overlay from "../../general/Overlay";
import ContentBlockButton from "../inputs/ContentBlockButton";
import BuilderSidebar from "../inputs/sidebar";
import AddContentModal from "../modals/AddContentModal";
import SelectTemplateModal from "../modals/SelectTemplateModal";
import CatalogueContent from "./CatalogueContent";
import CatalogueFooter from "./CatalogueFooter";
import CatalogueHeader from "./CatalogueHeader";
import Heading from "./components/Heading";

const Catalogue = ({
	item,
	type,
	userData,
}: {
	item: Catalogue;
	type?: "edit" | "view" | "demo";
	userData?: UserData;
}) => {
	const { catalogue } = useCatalogueContext() || {};
	const activeData = catalogue?.name ? catalogue : item;

	const [isAddContentOpen, setIsAddContentOpen] = useState(false);
	const [editingBlock, setEditingBlock] = useState<{
		block: ContentBlock;
		index: number;
	} | null>(null);
	const [showLimitsModal, setShowLimitsModal] = useState(false);

	const isDarkTheme = themes.some(
		(theme) =>
			theme.key === item.appearance.theme.name && theme.type === "dark",
	);

	const fontFamily =
		fontFamilyMap[item.appearance.style.fontFamily] || fontFamilyMap.inter;

	const contentFontSizeKey = item.appearance.style.contentFontSize || "medium";
	const contentFontSize = contentFontSizeMap[contentFontSizeKey];
	const titleFontSize = titleFontSizeMap[contentFontSizeKey];
	const borderRadius = `${item.appearance.style.borderRadius ?? 12}px`;
	const boxShadow = shadowMap[item.appearance.style.shadow || "low"];

	const defaultLogo = isDarkTheme ? "/logo-light.svg" : "/logo.svg";
	const customLogo = item.logo;
	const logoSrc = item.header.type === "custom" ? customLogo : defaultLogo;

	useEffect(() => {
		if (typeof window === "undefined") return;

		const originalTitle = document.title;
		const originalIcon =
			document.querySelector<HTMLLinkElement>("link[rel~='icon']")?.href || "";
		const originalAppleIcon =
			document.querySelector<HTMLLinkElement>("link[rel~='apple-touch-icon']")
				?.href || "";

		let plainHeading = "";
		try {
			plainHeading = htmlToText(activeData.heading || "");
		} catch (e) {
			console.log("Error occured: ", e);
		}

		const titleText =
			activeData.metadata?.title || activeData.name || plainHeading;
		if (titleText) {
			document.title = `${titleText} | Quicktalog`;
		}

		const iconUrl = activeData.metadata?.icon || "/opengraph-image.png";
		const updateOrCreateIcon = (rel: string) => {
			let link: HTMLLinkElement | null = document.querySelector(
				`link[rel~='${rel}']`,
			);
			if (!link) {
				link = document.createElement("link");
				link.rel = rel;
				document.head.appendChild(link);
			}
			link.href = iconUrl;
		};

		updateOrCreateIcon("icon");
		updateOrCreateIcon("apple-touch-icon");

		return () => {
			document.title = originalTitle;
			const iconLink =
				document.querySelector<HTMLLinkElement>("link[rel~='icon']");
			const appleIconLink = document.querySelector<HTMLLinkElement>(
				"link[rel~='apple-touch-icon']",
			);
			if (iconLink) iconLink.href = originalIcon;
			if (appleIconLink) appleIconLink.href = originalAppleIcon;
		};
	}, [
		activeData.metadata?.title,
		activeData.metadata?.icon,
		activeData.name,
		activeData.heading,
	]);

	// Set font CSS variables on documentElement so portaled components
	// (e.g. ItemDetailModal rendered via DialogPortal) can inherit them
	useEffect(() => {
		const root = document.documentElement;
		root.style.setProperty("--catalogue-font-heading", fontFamily);
		root.style.setProperty("--catalogue-font-body", fontFamily);
		return () => {
			root.style.removeProperty("--catalogue-font-heading");
			root.style.removeProperty("--catalogue-font-body");
		};
	}, [fontFamily]);

	const handleEditBlock = (index: number) => {
		const block = item.content[index];
		if (block) {
			setEditingBlock({ block, index });
			setIsAddContentOpen(true);
		}
	};
	if (!userData && type === "edit") return null;
	return (
		<>
			{type === "edit" && (
				<>
					<BuilderSidebar userData={userData} />
					<Link
						className="hidden fixed lg:flex bottom-20 left-4 md:bottom-6 md:left-6 z-[49] items-center gap-2 bg-white/90 backdrop-blur-sm text-gray-700 border border-gray-200 shadow-lg rounded-full pl-3 pr-4 py-2.5 text-sm font-medium hover:bg-white hover:shadow-xl hover:scale-105 active:scale-95 transition-all duration-200"
						href="/admin/dashboard"
					>
						<ArrowLeft className="w-4 h-4 shrink-0" />
						<span>Dashboard</span>
					</Link>
					<style
						dangerouslySetInnerHTML={{
							__html: `
						@media (max-width: 768px) {
							#hubspot-messages-iframe-container {
								display: none !important;
							}
						}
					`,
						}}
					/>
				</>
			)}
			<div
				aria-label={`${item.heading} Catalogue`}
				className={`${item.appearance.theme.name || "theme-monochrome"} bg-background text-foreground min-h-screen flex flex-col`}
				role="application"
				style={
					{
						fontFamily,
						"--catalogue-font-heading": fontFamily,
						"--catalogue-font-body": fontFamily,
						"--catalogue-weight-heading": "700",
						"--catalogue-weight-body": "400",
						// New Style Variables
						"--content-font-size": contentFontSize,
						"--title-font-size": titleFontSize,
						"--border-radius": borderRadius,
						"--box-shadow": boxShadow,
						"--animation-duration": "0.5s",
						// Override theme-specific section header shadow if needed
						"--catalogue-category-shadow":
							boxShadow !== "none" ? boxShadow : undefined,
					} as React.CSSProperties
				}
			>
				{item.appearance.overlay.isEnabled && (
					<Overlay emoji={item.appearance.overlay.icon} />
				)}

				{type !== "demo" && (
					<CatalogueHeader data={item} logo={logoSrc} type={item.header.type} />
				)}

				<main
					aria-label="Catalogue content"
					className={`flex-1 flex flex-col min-h-0 relative ${type === "demo" && "pt-16"}`}
				>
					{item.appearance.overlay.isEnabled && (
						<Overlay emoji={item.appearance.overlay.icon} />
					)}
					<section
						aria-labelledby={item.heading}
						className="flex flex-col justify-start items-center text-center px-4 md:pt-16 flex-shrink-0 w-full"
					>
						<div className="mb-4 w-full">
							<Heading item={item} type={type} />
						</div>
						{type === "demo" && (
							<div className="flex flex-col justify-center items-center w-full mt-6">
								<AppearanceOptions />
							</div>
						)}
					</section>
					<section
						aria-label="Catalogue content"
						className="flex-1 w-full max-w-7xl mx-auto lg:px-8 pb-8 min-h-[60vh]"
					>
						{item && (
							<CatalogueContent
								currency={item.currency}
								data={item.content}
								mode={type === "edit" ? "edit" : "view"}
								onEditBlock={handleEditBlock}
								theme={item.appearance.theme.name}
								type="item"
								userData={userData}
							/>
						)}
						{type === "edit" && (
							<ContentBlockButton
								setIsAddContentOpen={() => {
									const limit =
										userData?.currentPlan?.features?.blocks_per_catalogue;
									if (limit !== "unlimited" && limit !== undefined) {
										if (item.content.length >= limit) {
											setShowLimitsModal(true);
											return;
										}
									}
									setIsAddContentOpen(true);
								}}
							/>
						)}
					</section>
				</main>

				<CatalogueFooter data={item} logo={logoSrc} type={item.footer.type} />

				{userData && (
					<AddContentModal
						blockIndex={editingBlock?.index}
						editingBlock={editingBlock?.block}
						isOpen={isAddContentOpen}
						onClose={() => {
							setIsAddContentOpen(false);
							setEditingBlock(null);
						}}
						setIsOpen={setIsAddContentOpen}
						userData={userData}
					/>
				)}

				<LimitsModal
					currentPlan={userData?.currentPlan}
					isOpen={showLimitsModal}
					onClose={() => setShowLimitsModal(false)}
					requiredPlan={userData?.nextPlan || tiers[tiers.length - 1]}
					type="categories"
				/>
				{type === "edit" && <SelectTemplateModal />}
			</div>
		</>
	);
};

export default Catalogue;
