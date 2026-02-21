"use client";
import AppearanceOptions from "@/components/general/AppearanceOptions";
import LimitsModal from "@/components/modals/LimitsModal";
import type { Catalogue, ContentBlock, UserData } from "@quicktalog/common";
import { themes, tiers } from "@quicktalog/common";
import { useState } from "react";
import HtmlContent from "../../general/HtmlContent";
import Overlay from "../../general/Overlay";
import BuilderSidebar from "../inputs/BuilderSidebar";
import ContentBlockButton from "../inputs/ContentBlockButton";
import HeadingInput from "../inputs/HeadingInput";
import AddContentModal from "../modals/AddContentModal";
import SelectTemplateModal from "../modals/SelectTemplateModal";
import CatalogueContent from "./CatalogueContent";
import CatalogueFooter from "./CatalogueFooter";
import CatalogueHeader from "./CatalogueHeader";

// Map font family keys to CSS variable values
const fontFamilyMap: Record<string, string> = {
	arial: "Arial, sans-serif",
	inter: "var(--font-inter)",
	lora: "var(--font-lora-regular)",
	playfair: "var(--font-playfair-display)",
	nunito: "var(--font-nunito)",
	crimson: "var(--font-crimson-text)",
	poppins: "var(--font-poppins)",
};

// Map font size keys to CSS values
const contentFontSizeMap: Record<string, string> = {
	small: "0.875rem",
	medium: "1rem",
	large: "1.125rem",
};

// Map shadow keys to CSS values
const shadowMap: Record<string, string> = {
	none: "none",
	low: "0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)",
	medium: "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
	high: "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)",
};

// Map animation keys to duration values
const animationMap: Record<string, string> = {
	none: "0s",
	minimal: "0.15s",
	medium: "0.3s",
	full: "0.5s",
};

const Catalogue = ({
	item,
	type,
	userData,
}: {
	item: Catalogue;
	type?: "edit" | "view" | "demo";
	userData?: UserData;
}) => {
	const isCustom = type !== "demo";
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

	// Get the font family CSS value from the map
	const fontFamily =
		fontFamilyMap[item.appearance.style.fontFamily] || fontFamilyMap.arial;

	// Get other style values
	const contentFontSize =
		contentFontSizeMap[item.appearance.style.contentFontSize || "medium"];
	// Default to 12 if undefined
	const borderRadius = `${item.appearance.style.borderRadius ?? 12}px`;
	const boxShadow = shadowMap[item.appearance.style.shadow || "low"];

	const defaultLogo = isDarkTheme ? "/logo-light.svg" : "/logo.svg";
	const customLogo = item.logo || defaultLogo;

	const logoSrc = isCustom ? customLogo : defaultLogo;

	const handleEditBlock = (index: number) => {
		const block = item.content[index];
		if (block) {
			setEditingBlock({ block, index });
			setIsAddContentOpen(true);
		}
	};

	return (
		<>
			{type === "edit" && <BuilderSidebar />}
			<div
				aria-label={`${item.heading} Catalogue`}
				className={`${item.appearance.theme.name || "theme-monochrome"} bg-background text-foreground min-h-screen flex flex-col`}
				role="application"
				style={
					{
						fontFamily,
						"--font-family-heading": fontFamily,
						"--font-family-body": fontFamily,
						"--font-weight-heading": "700",
						"--font-weight-body": "400",
						// New Style Variables
						"--content-font-size": contentFontSize,
						"--border-radius": borderRadius,
						"--box-shadow": boxShadow,
						"--animation-duration": "0.5s",
						// Override theme-specific section header shadow if needed
						"--section-header-shadow":
							boxShadow !== "none" ? boxShadow : undefined,
					} as React.CSSProperties
				}
			>
				{item.appearance.overlay.isEnabled && (
					<Overlay emoji={item.appearance.overlay.icon} />
				)}

				<CatalogueHeader
					data={item}
					logo={logoSrc}
					type={isCustom ? "custom" : "default"}
				/>

				<main
					aria-label="Service catalogue content"
					className="flex-1 flex flex-col min-h-0 relative"
				>
					{item.appearance.overlay.isEnabled && (
						<Overlay emoji={item.appearance.overlay.icon} />
					)}
					<section
						aria-labelledby={item.heading}
						className="flex flex-col justify-start items-center text-center px-4 pt-8 sm:pt-12 md:pt-16 flex-shrink-0 w-full"
					>
						<div className="max-w-[95%] sm:max-w-5xl mx-auto">
							{type === "edit" ? (
								<HeadingInput />
							) : (
								(() => {
									// Only render if heading has content
									if (!item.heading) return null;
									// If heading is plain text (no HTML h1 tag), wrap with default large size
									const isHtml = item.heading.includes("<h1");
									const headingHtml = isHtml
										? item.heading
										: `<h1 class="text-3xl sm:text-5xl font-heading font-semibold text-heading drop-shadow-sm mb-4 text-center" data-size="large">${item.heading}</h1>`;
									return <HtmlContent className="" html={headingHtml} />;
								})()
							)}
						</div>
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

				<CatalogueFooter
					data={item}
					logo={logoSrc}
					type={isCustom ? "custom" : "default"}
				/>

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
					isOpen={showLimitsModal}
					onClose={() => setShowLimitsModal(false)}
					currentPlan={userData?.currentPlan}
					requiredPlan={userData?.nextPlan || tiers[tiers.length - 1]}
					type="categories"
				/>
				{type === "edit" && <SelectTemplateModal />}
			</div>
		</>
	);
};

export default Catalogue;
