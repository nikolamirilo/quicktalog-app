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
		"A group of items. With a heading it can collapse; without one it is a plain grid.",
	embedding:
		"Embed external content such as maps, videos, or third-party widgets.",
	custom_code: "Insert custom HTML to add advanced or custom functionality.",
	text: "Add rich text content with headings, lists, links, and formatting.",
	divider:
		"Add a visual separator with customizable spacing and border styles.",
};

/**
 * Name and description of the chosen section type. On phones the pill bar
 * already names it, so only the description shows, as a hint at the top of the
 * form; the name and the close button show from `md`.
 */
const BlockConfigHeader = ({
	selectedOption,
	onClose,
}: BlockConfigHeaderProps) => {
	return (
		<BuilderDialogHeader className="max-md:border-b-0 max-md:pb-0 max-md:pt-3">
			<div className="min-w-0">
				<h3 className="hidden font-product-heading text-base font-bold leading-tight text-product-foreground md:block">
					{LABELS[selectedOption]}
				</h3>
				<AlertDialogDescription className="text-[13px] leading-[18px] md:mt-1">
					{DESCRIPTIONS[selectedOption]}
				</AlertDialogDescription>
			</div>
			<BuilderDialogClose className="hidden md:inline-flex" onClick={onClose} />
		</BuilderDialogHeader>
	);
};

export default BlockConfigHeader;
