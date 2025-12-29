"use client";
import {
	AlertDialog,
	AlertDialogContent,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { useCatalogueContext } from "@/context/CatalogueContext";
import { Code, Folder, Globe, Layout, X } from "lucide-react";
import { useEffect, useState } from "react";
import ContentInput from "../inputs/ContentInput";
import CustomCodeInput from "../inputs/CustomCodeInput";
import IframeInput from "../inputs/IframeInput";

interface AddContentModalProps {
	isOpen: boolean;
	onClose: () => void;
	setIsOpen: (open: boolean) => void;
}

type ContentOption = "container" | "category" | "iframe" | "custom_code";

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
					<div className="flex-1 px-3 space-y-2">
						<Button
							variant={selectedOption === "container" ? "default" : "ghost"}
							className={`w-full justify-start gap-3 h-auto py-3 px-4 text-base font-normal ${
								selectedOption === "container"
									? "bg-product-primary shadow-product-shadow hover:text-white  text-white"
									: "text-product-foreground hover:text-product-foreground hover:bg-gray-100/50"
							}`}
							onClick={() => setSelectedOption("container")}
						>
							<Layout
								className={`w-6 h-6 ${selectedOption === "container" ? "text-white" : "text-product-foreground"}`}
							/>
							<span className="font-medium">Container</span>
						</Button>
						<Button
							variant={selectedOption === "category" ? "default" : "ghost"}
							className={`w-full justify-start gap-3 h-auto py-3 px-4 text-base font-normal ${
								selectedOption === "category"
									? "bg-product-primary shadow-product-shadow hover:text-white  text-white"
									: "text-product-foreground hover:text-product-foreground hover:bg-gray-100/50"
							}`}
							onClick={() => setSelectedOption("category")}
						>
							<Folder
								className={`w-6 h-6 ${selectedOption === "category" ? "text-white" : "text-product-foreground"}`}
							/>
							<span className="font-medium">Category</span>
						</Button>
						<Button
							variant={selectedOption === "iframe" ? "default" : "ghost"}
							className={`w-full justify-start gap-3 h-auto py-3 px-4 text-base font-normal ${
								selectedOption === "iframe"
									? "bg-product-primary shadow-product-shadow hover:text-white text-white"
									: "text-product-foreground hover:text-product-foreground hover:bg-gray-100/50"
							}`}
							onClick={() => setSelectedOption("iframe")}
						>
							<Globe
								className={`w-6 h-6 ${selectedOption === "iframe" ? "text-white" : "text-product-foreground"}`}
							/>
							<span className="font-medium">Iframe</span>
						</Button>
						<Button
							variant={selectedOption === "custom_code" ? "default" : "ghost"}
							className={`w-full justify-start gap-3 h-auto py-3 px-4 text-base font-normal ${
								selectedOption === "custom_code"
									? "bg-product-primary shadow-product-shadow hover:text-white text-white"
									: "text-product-foreground hover:text-product-foreground hover:bg-gray-100/50"
							}`}
							onClick={() => setSelectedOption("custom_code")}
						>
							<Code
								className={`w-6 h-6 ${selectedOption === "custom_code" ? "text-white" : "text-product-foreground"}`}
							/>
							<span className="font-medium">Custom Code</span>
						</Button>
					</div>
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
									"A flexible container for mixed content items."}
								{selectedOption === "category" &&
									"A titled section for grouping specific items."}
								{selectedOption === "iframe" &&
									"Embed external content like maps or videos."}
								{selectedOption === "custom_code" &&
									"Add custom HTML code to your catalogue."}
							</p>
						</div>
						<Button
							variant="ghost"
							size="icon"
							onClick={onClose}
							className="text-gray-400 hover:text-product-primary rounded-full hover:bg-gray-100"
						>
							<X className="w-5 h-5" />
						</Button>
					</div>

					<div className="flex-1 overflow-y-auto">
						<div className="max-w-2xl">
							{selectedOption === "category" && (
								<ContentInput
									value={blockData}
									onChange={(val) => setBlockData({ ...blockData, ...val })}
									type="category"
								/>
							)}

							{selectedOption === "container" && (
								<ContentInput
									value={blockData}
									onChange={(val) => setBlockData({ ...blockData, ...val })}
									type="container"
								/>
							)}

							{selectedOption === "iframe" && (
								<IframeInput
									value={blockData}
									onChange={(val) => setBlockData({ ...blockData, ...val })}
								/>
							)}

							{selectedOption === "custom_code" && (
								<CustomCodeInput
									value={blockData}
									onChange={(val) => setBlockData({ ...blockData, ...val })}
								/>
							)}
						</div>
					</div>

					{/* Footer Actions */}
					<div className="p-6 border-t border-gray-100 flex justify-end gap-3 bg-white">
						<Button
							variant="outline"
							onClick={onClose}
							className="hover:text-product-primary hover:border-product-primary"
						>
							Cancel
						</Button>
						<Button
							onClick={handleAdd}
							disabled={!isFormValid()}
							className="bg-product-primary text-secondary hover:bg-product-primary/90 disabled:opacity-50"
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
