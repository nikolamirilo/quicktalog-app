"use client";

import { AlertDialogDescription } from "@/components/ui/alert-dialog";
import { BuilderDialogClose, BuilderDialogHeader } from "./BuilderDialog";

export type ContentOption =
	| "items"
	| "text"
	| "embedding"
	| "custom_code"
	| "divider";

interface BlockConfigHeaderProps {
	selectedOption: ContentOption;
	onClose: () => void;
}

const LABELS: Record<ContentOption, string> = {
	items: "Items",
	text: "Text",
	embedding: "External content",
	custom_code: "Custom code",
	divider: "Divider",
};

const DESCRIPTIONS: Record<ContentOption, string> = {
	items:
		"A section of items. Give it a heading to make it collapsible, or leave the heading off for a plain grid.",
	embedding:
		"Embed external content such as maps, videos, or third-party widgets.",
	custom_code: "Insert custom HTML to add advanced or custom functionality.",
	text: "Add rich text content with headings, lists, links, and formatting.",
	divider:
		"Add a visual separator with customizable spacing and border styles.",
};

/**
 * Name and description of the chosen section type. On phones the chips above
 * already name it, so only the description shows; the close button shows from `md`.
 */
const BlockConfigHeader = ({
	selectedOption,
	onClose,
}: BlockConfigHeaderProps) => {
	return (
		<BuilderDialogHeader className="py-3 md:pb-4 md:pt-6">
			<div className="min-w-0">
				<h3 className="hidden font-product-heading text-lg md:block font-bold leading-tight text-product-foreground">
					{LABELS[selectedOption]}
				</h3>
				<AlertDialogDescription className="text-sm leading-relaxed md:mt-1">
					{DESCRIPTIONS[selectedOption]}
				</AlertDialogDescription>
			</div>
			<BuilderDialogClose className="hidden md:inline-flex" onClick={onClose} />
		</BuilderDialogHeader>
	);
};

export default BlockConfigHeader;
