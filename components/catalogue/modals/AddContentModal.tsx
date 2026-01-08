"use client";
import {
	AlertDialog,
	AlertDialogContent,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { useCatalogueContext } from "@/context/CatalogueContext";
import { X } from "lucide-react";
import { useEffect, useState } from "react";
import { ContentOptionsSelector } from "../blocks/common/ContentOptionsSelector";
import RichTextEditor from "../blocks/common/RichTextEditor";
import ContentInput from "../inputs/ContentInput";
import CustomCodeInput from "../inputs/CustomCodeInput";
import IframeInput from "../inputs/IframeInput";

interface AddContentModalProps {
	isOpen: boolean;
	onClose: () => void;
	setIsOpen: (open: boolean) => void;
}

type ContentOption =
	| "container"
	| "category"
	| "text"
	| "iframe"
	| "custom_code";

const AddContentModal = ({
	isOpen,
	onClose,
	setIsOpen,
}: AddContentModalProps) => {
	const { catalogue, updateCatalogue } = useCatalogueContext() || {};
	const [selectedOption, setSelectedOption] =
		useState<ContentOption>("container");
	const [blockData, setBlockData] = useState({
		name: "",
		layout: "variant_1",
		src: "",
		items: [],
		code: "",
		content: "",
	});

	useEffect(() => {
		if (!isOpen) {
			setSelectedOption("container");
			setBlockData({
				name: "",
				layout: "variant_1",
				src: "",
				items: [],
				code: "",
				content: "",
			});
		}
	}, [isOpen]);

	const handleAdd = () => {
		if (!catalogue || !updateCatalogue) return;

		const newOrder = catalogue.content.length;
		let newBlock: any = {
			id: crypto.randomUUID(),
			order: newOrder,
			type: selectedOption,
		};

		if (selectedOption === "category") {
			newBlock = {
				...newBlock,
				name: blockData.name,
				layout: blockData.layout,
				items: [],
			};
		} else if (selectedOption === "container") {
			newBlock = {
				...newBlock,
				name: "Container",
				layout: blockData.layout,
				items: [],
			};
		} else if (selectedOption === "iframe") {
			newBlock = {
				...newBlock,
				src: blockData.src,
			};
		} else if (selectedOption === "custom_code") {
			newBlock = {
				...newBlock,
				code: blockData.code,
			};
		} else if (selectedOption === "text") {
			newBlock = {
				...newBlock,
				content: blockData.content || "<p>New text block</p>",
			};
		}

		updateCatalogue({
			content: [...catalogue.content, newBlock],
		});
		setIsOpen(false);
	};

	const isFormValid = () => {
		if (selectedOption === "category")
			return (blockData.name?.trim().length ?? 0) > 0;
		if (selectedOption === "iframe")
			return (blockData.src?.trim().length ?? 0) > 0;
		if (selectedOption === "custom_code")
			return (blockData.code?.trim().length ?? 0) > 0;
		return true;
	};

	return (
		<AlertDialog onOpenChange={(open) => !open && onClose()} open={isOpen}>
			<AlertDialogContent className="max-w-5xl p-0 overflow-hidden bg-product-background rounded-2xl border-none shadow-2xl flex flex-row h-[600px] font-body text-product-foreground">
				<div className="w-1/4 bg-gray-200/50 border-r border-gray-300 flex flex-col">
					<div className="p-6 pb-4">
						<AlertDialogTitle className="text-xl text-product-foreground">
							Select content type
						</AlertDialogTitle>
						<p className="text-sm text-gray-500 mt-1"></p>
					</div>
					<ContentOptionsSelector
						onSelect={setSelectedOption}
						selectedOption={selectedOption}
					/>
				</div>

				{/* Right Content - 3/4 width */}
				<div className="flex-1 flex flex-col min-w-0">
					{/* Header */}
					<div className="p-6 border-b border-gray-100 flex justify-between items-start">
						<div>
							<h3 className="text-lg font-semibold text-product-foreground capitalize">
								{selectedOption.split("_").join(" ")}
							</h3>
							<p className="text-sm text-gray-500 mt-1">
								{selectedOption === "container" &&
									"A layout block that holds multiple items in a single structured section."}

								{selectedOption === "category" &&
									"A collapsible section used to group related items under one heading."}

								{selectedOption === "iframe" &&
									"Embed external content such as maps, videos, or third-party widgets."}

								{selectedOption === "custom_code" &&
									"Insert custom HTML to add advanced or custom functionality."}

								{selectedOption === "text" &&
									"Add rich text content with headings, lists, links, and formatting."}
							</p>
						</div>
						<Button
							className="text-gray-400 hover:text-product-primary rounded-full hover:bg-gray-100"
							onClick={onClose}
							size="icon"
							variant="ghost"
						>
							<X className="w-5 h-5" />
						</Button>
					</div>

					<div className="flex-1 overflow-y-auto">
						<div className="max-w-2xl">
							{selectedOption === "category" && (
								<ContentInput
									onChange={(val) => setBlockData({ ...blockData, ...val })}
									type="category"
									value={blockData}
								/>
							)}

							{selectedOption === "container" && (
								<ContentInput
									onChange={(val) => setBlockData({ ...blockData, ...val })}
									type="container"
									value={blockData}
								/>
							)}

							{selectedOption === "iframe" && (
								<IframeInput
									onChange={(val) => setBlockData({ ...blockData, ...val })}
									value={blockData}
								/>
							)}

							{selectedOption === "custom_code" && (
								<CustomCodeInput
									onChange={(val) => setBlockData({ ...blockData, ...val })}
									value={blockData}
								/>
							)}

							{selectedOption === "text" && (
								<div className="p-4">
									<label className="block text-sm font-medium mb-2 text-gray-700">
										Content
									</label>
									<RichTextEditor
										className="border-gray-200"
										content={blockData.content || "<p>Text</p>"}
										onChange={(val) =>
											setBlockData({ ...blockData, content: val })
										}
									/>
								</div>
							)}
						</div>
					</div>

					{/* Footer Actions */}
					<div className="p-6 border-t border-gray-100 flex justify-end gap-3 bg-white">
						<Button
							className="hover:text-product-primary hover:border-product-primary"
							onClick={onClose}
							variant="outline"
						>
							Cancel
						</Button>
						<Button
							className="bg-product-primary text-secondary hover:bg-product-primary/90 disabled:opacity-50"
							disabled={!isFormValid()}
							onClick={handleAdd}
						>
							Add {selectedOption}
						</Button>
					</div>
				</div>
			</AlertDialogContent>
		</AlertDialog>
	);
};

export default AddContentModal;
