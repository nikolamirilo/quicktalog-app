"use client";

import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

type ContentOption =
	| "container"
	| "category"
	| "text"
	| "embedding"
	| "custom_code"
	| "divider";

interface BlockConfigHeaderProps {
	selectedOption: ContentOption;
	onClose: () => void;
}

const DESCRIPTIONS: Record<ContentOption, string> = {
	container:
		"A layout block that holds multiple items in a single structured section.",
	category:
		"A collapsible section used to group related items under one heading.",
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
				<h3 className="text-xl text-product-foreground font-semibold capitalize">
					{selectedOption.split("_").join(" ")}
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
