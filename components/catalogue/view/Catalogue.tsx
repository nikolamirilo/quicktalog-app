"use client";
import AppearanceOptions from "@/components/general/AppearanceOptions";
import type { Catalogue, ContentBlock } from "@quicktalog/common";
import { themes } from "@quicktalog/common";
import { useState } from "react";
import Overlay from "../../general/Overlay";
import BuilderSidebar from "../inputs/BuilderSidebar";
import ContentBlockButton from "../inputs/ContentBlockButton";
import HeadingInput from "../inputs/HeadingInput";
import AddContentModal from "../modals/AddContentModal";
import CatalogueContent from "./CatalogueContent";
import CatalogueFooter from "./CatalogueFooter";
import CatalogueHeader from "./CatalogueHeader";

const Catalogue = ({
	item,
	type,
}: {
	item: Catalogue;
	type?: "edit" | "view" | "demo";
}) => {
	const isCustom = type !== "demo";
	const [isAddContentOpen, setIsAddContentOpen] = useState(false);
	const [editingBlock, setEditingBlock] = useState<{
		block: ContentBlock;
		index: number;
	} | null>(null);

	const isDarkTheme = themes.some(
		(theme) =>
			theme.key === item.appearance.theme.name && theme.type === "dark",
	);

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
				className={`${item.appearance.theme.name || "theme-monochrome"} bg-background !font-${item.appearance.style.fontFamily} text-foreground min-h-screen flex flex-col`}
				role="application"
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
						className="flex flex-col justify-start items-center text-center px-4 pt-8 sm:pt-12 md:pt-16 flex-shrink-0"
					>
						<div className="max-w-4xl mx-auto">
							{type === "edit" ? (
								<HeadingInput />
							) : (
								<h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-lora font-semibold text-heading drop-shadow-sm mb-4">
									{item.heading}
								</h1>
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
							/>
						)}
						{type === "edit" && (
							<ContentBlockButton setIsAddContentOpen={setIsAddContentOpen} />
						)}
					</section>
				</main>

				<CatalogueFooter
					data={item}
					logo={logoSrc}
					type={isCustom ? "custom" : "default"}
				/>

				<AddContentModal
					blockIndex={editingBlock?.index}
					editingBlock={editingBlock?.block}
					isOpen={isAddContentOpen}
					onClose={() => {
						setIsAddContentOpen(false);
						setEditingBlock(null);
					}}
					setIsOpen={setIsAddContentOpen}
				/>
			</div>
		</>
	);
};

export default Catalogue;
