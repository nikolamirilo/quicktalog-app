"use client";

import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

type ContentOption = "items" | "text" | "embedding" | "custom_code" | "divider";

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

const BlockConfigHeader = ({
	selectedOption,
	onClose,
}: BlockConfigHeaderProps) => {
	return (
		<div className="pt-0 pb-4 border-gray-100 flex justify-between items-start">
			<div>
				<h3 className="text-xl text-product-foreground font-semibold">
					{LABELS[selectedOption]}
				</h3>
				<p className="text-sm text-gray-700 mt-1">
					{DESCRIPTIONS[selectedOption]}
				</p>
			</div>
			<Button
				className="hidden md:inline-flex text-gray-400 hover:text-product-primary rounded-full hover:bg-gray-100"
				onClick={onClose}
				size="icon"
				variant="ghost"
			>
				<X className="w-5 h-5" />
			</Button>
		</div>
	);
};

export default BlockConfigHeader;
