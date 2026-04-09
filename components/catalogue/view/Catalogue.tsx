"use client";
import AppearanceOptions from "@/components/general/AppearanceOptions";
import LimitsModal from "@/components/modals/LimitsModal";
import {
	contentFontSizeMap,
	fontFamilyMap,
	shadowMap,
	titleFontSizeMap,
} from "@/constants/builder";
import { htmlToText } from "@/helpers/client";
import type { Catalogue, ContentBlock, UserData } from "@quicktalog/common";
import { themes, tiers } from "@quicktalog/common";
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

		let plainHeading = "";
		try {
			plainHeading = htmlToText(item.heading || "");
		} catch (e) {
			console.log("Error occured: ", e);
		}

		const titleText = item.metadata?.title || item.name || plainHeading;
		if (titleText) {
			document.title = `${titleText} | Quicktalog`;
		}

		const iconUrl = item.metadata?.icon || "/opengraph-image.png";
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
	}, [item.metadata?.title, item.metadata?.icon, item.name, item.heading]);

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

				<CatalogueHeader data={item} logo={logoSrc} type={item.header.type} />

				<main
					aria-label="Catalogue content"
					className="flex-1 flex flex-col min-h-0 relative"
				>
					{item.appearance.overlay.isEnabled && (
						<Overlay emoji={item.appearance.overlay.icon} />
					)}
					<section
						aria-labelledby={item.heading}
						className="flex flex-col justify-start items-center text-center px-4 pt-8 sm:pt-12 md:pt-16 flex-shrink-0 w-full"
					>
						<Heading item={item} type={type} />
						{type === "demo" && (
							<div className="flex flex-col justify-center items-center w-full mt-6">
								<AppearanceOptions />
							</div>
						)}
					</section>
					<section
						aria-label="Services and items"
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
