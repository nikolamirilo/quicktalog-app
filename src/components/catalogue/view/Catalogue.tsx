"use client";
import { AppearanceOptions } from "@/components/general/AppearanceOptions";
import { LimitsModal } from "@/components/modals/LimitsModal";
import {
	contentFontSizeMap,
	fontFamilyMap,
	shadowMap,
	titleFontSizeMap,
} from "@/constants/builder";
import { useCatalogueContext } from "@/context/CatalogueContext";
import {
	backgroundLayerStyle,
	normalizeBackground,
} from "@/lib/catalogue/background";
import { glassAttributes, glassStyle } from "@/lib/catalogue/glass";
import { localeForLanguage, normalizeSearch } from "@/lib/catalogue/items";
import { kebabToTitle } from "@/lib/format/text";
import { htmlToText } from "@/lib/html/to-text";
import {
	deriveCatalogueVars,
	isDarkTheme as isThemeDark,
	serializeThemeCss,
} from "@/lib/themes/custom-theme";
import type { Catalogue, ContentBlock, UserData } from "@quicktalog/common";
import { getRequiredPlan } from "@/lib/entitlements/required-plan";
import { useEffect, useMemo, useState } from "react";
import { Overlay } from "@/components/general/Overlay";
import CatalogueChat from "@/components/catalogue/chat/CatalogueChat";
import { AiReviewHighlights } from "@/components/catalogue/view/AiReviewHighlights";
import ContentBlockButton from "@/components/catalogue/inputs/ContentBlockButton";
import BuilderSidebar from "@/components/catalogue/inputs/sidebar";
import { builderFramePadding } from "@/components/catalogue/builder/frame";
import AddContentModal from "@/components/catalogue/modals/AddContentModal";
import SelectTemplateModal from "@/components/catalogue/modals/SelectTemplateModal";
import { catalogueLogos } from "@/lib/catalogue/logo";
import CatalogueAnalytics from "./CatalogueAnalytics";
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
	const { catalogue, isSidebarOpen = false } = useCatalogueContext() || {};
	const activeData = catalogue?.name ? catalogue : item;

	const [isAddContentOpen, setIsAddContentOpen] = useState(false);
	const [editingBlock, setEditingBlock] = useState<{
		block: ContentBlock;
		index: number;
	} | null>(null);
	const [showLimitsModal, setShowLimitsModal] = useState(false);

	const isCustomTheme = item.appearance.theme.type === "custom";

	const customThemeCss = useMemo(() => {
		if (!isCustomTheme) return "";
		return serializeThemeCss(deriveCatalogueVars(item.appearance.theme.colors));
	}, [isCustomTheme, item.appearance.theme.colors]);

	const isDarkTheme = isThemeDark(item.appearance.theme);

	const fontFamily =
		fontFamilyMap[item.appearance.style.fontFamily] || fontFamilyMap.inter;

	const contentFontSizeKey = item.appearance.style.contentFontSize || "medium";
	const contentFontSize = contentFontSizeMap[contentFontSizeKey];
	const titleFontSize = titleFontSizeMap[contentFontSizeKey];
	const borderRadius = `${item.appearance.style.borderRadius ?? 12}px`;
	const boxShadow = shadowMap[item.appearance.style.shadow || "low"];
	const search = normalizeSearch(item.appearance.search);
	const background = normalizeBackground(item.appearance.background);
	const backgroundLayer = backgroundLayerStyle(background);

	const defaultLogo = isDarkTheme
		? "/images/brand/logo-light.svg"
		: "/images/brand/logo.svg";
	const logos = catalogueLogos(
		{
			logo: item.logo,
			headerType: item.header.type,
			footerType: item.footer.type,
		},
		defaultLogo,
	);

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
			activeData.metadata?.title ||
			kebabToTitle(activeData.name) ||
			plainHeading;
		if (titleText) {
			document.title = `${titleText} | Quicktalog`;
		}

		const iconUrl =
			activeData.metadata?.icon || "/images/brand/opengraph-image.png";
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

	// Set font and corner CSS variables on documentElement so portaled components
	// (e.g. ItemDetailModal rendered via DialogPortal) can inherit them
	useEffect(() => {
		const root = document.documentElement;
		root.style.setProperty("--catalogue-font-heading", fontFamily);
		root.style.setProperty("--catalogue-font-body", fontFamily);
		root.style.setProperty("--border-radius", borderRadius);
		return () => {
			root.style.removeProperty("--catalogue-font-heading");
			root.style.removeProperty("--catalogue-font-body");
			root.style.removeProperty("--border-radius");
		};
	}, [fontFamily, borderRadius]);

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
					<CatalogueChat userData={userData} />
					<AiReviewHighlights />
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
			{customThemeCss && (
				<style dangerouslySetInnerHTML={{ __html: customThemeCss }} />
			)}
			<div
				{...glassAttributes(item.appearance.glass)}
				aria-label={`${item.heading} Catalogue`}
				className={`catalogue-root ${item.appearance.theme.name || "theme-monochrome"} bg-background text-foreground min-h-screen flex flex-col${type === "edit" ? ` ${builderFramePadding(isSidebarOpen)}` : ""}`}
				data-bg={backgroundLayer ? "" : undefined}
				data-dark={isDarkTheme ? "" : undefined}
				role="application"
				style={
					{
						fontFamily,
						"--catalogue-font-heading": fontFamily,
						"--catalogue-font-body": fontFamily,
						"--catalogue-weight-heading": "700",
						"--catalogue-weight-body": "400",
						"--content-font-size": contentFontSize,
						"--title-font-size": titleFontSize,
						"--border-radius": borderRadius,
						"--box-shadow": boxShadow,
						// `none` can't sit in a shadow list next to the glass edge highlight.
						"--box-shadow-safe": boxShadow === "none" ? "0 0 #0000" : boxShadow,
						"--animation-duration": "0.5s",
						"--catalogue-category-shadow":
							boxShadow !== "none" ? boxShadow : undefined,
						...glassStyle(item.appearance.glass, isDarkTheme),
					} as React.CSSProperties
				}
			>
				{backgroundLayer && (
					<div
						aria-hidden="true"
						className="cat-bg"
						data-photo={background.type === "image" ? "" : undefined}
						style={backgroundLayer}
					>
						{background.type === "image" && (
							<span
								className="cat-bg-fade"
								style={{ opacity: background.fade / 100 }}
							/>
						)}
					</div>
				)}
				{item.appearance.overlay.isEnabled && (
					<Overlay emoji={item.appearance.overlay.icon} />
				)}

				{type !== "demo" && (
					<CatalogueHeader
						data={item}
						logo={logos.header}
						type={item.header.type}
					/>
				)}

				<main
					aria-label="Catalogue content"
					className={`flex-1 flex flex-col min-h-0 relative ${type === "demo" && "pt-16"}`}
				>
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
								locale={localeForLanguage(item.language)}
								mode={type === "edit" ? "edit" : "view"}
								onEditBlock={handleEditBlock}
								search={search}
								theme={item.appearance.theme.name}
								type="item"
								userData={userData}
							/>
						)}
						{type === "edit" && (
							<ContentBlockButton
								setIsAddContentOpen={() => {
									const limit =
										userData?.currentPlan?.features?.sections_per_catalogue;
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
					logo={logos.footer}
					type={item.footer.type}
				/>

				{/* Published pages only. The builder and the demo must not report
				    traffic the owner never received. */}
				{type === "view" && (
					<CatalogueAnalytics
						businessName={item.legal?.legalName || undefined}
						metadata={item.metadata}
						privacyPolicyUrl={item.legal?.privacyPolicy || undefined}
						slug={item.name}
					/>
				)}

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
					requiredPlan={
						userData
							? getRequiredPlan(userData.currentPlan, "sections")
							: undefined
					}
					type="sections"
				/>
				{type === "edit" && <SelectTemplateModal />}
			</div>
		</>
	);
};

export default Catalogue;
