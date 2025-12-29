"use client";
import { AlertDialogTitle } from "@radix-ui/react-alert-dialog";
import { X } from "lucide-react";
import React, { useEffect, useState } from "react";
import { AlertDialog, AlertDialogContent } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { useCatalogueContext } from "@/context/CatalogueContext";
import { CategoryBlock } from "@/types/catalogue";
import ContentInput from "../inputs/ContentInput";

interface ContentInputModalProps {
	isOpen: boolean;
	onClose: () => void;
	setIsOpen: (open: boolean) => void;
}

const ContentInputModal = ({
	isOpen,
	onClose,
	setIsOpen,
}: ContentInputModalProps) => {
	const context = useCatalogueContext();
	const [draftContent, setDraftContent] = useState<CategoryBlock | null>(null);
	if (!context) return null;

	const { catalogue, updateCatalogue } = context;

	useEffect(() => {
		if (isOpen && !draftContent) {
			setDraftContent({
				order: catalogue.content.length,
				name: "",
				type: "category",
				layout: "variant_1",
				items: [],
			} as any);
		}
		if (!isOpen) {
			setDraftContent(null);
		}
	}, [isOpen, catalogue.content.length]);

	const handleAdd = () => {
		if (draftContent) {
			updateCatalogue({
				content: [...catalogue.content, draftContent],
			});
			setIsOpen(false);
		}
	};

	return (
		<AlertDialog onOpenChange={(open) => !open && onClose()} open={isOpen}>
			<AlertDialogContent className="max-w-4xl p-0 overflow-hidden bg-white rounded-2xl border-none shadow-2xl gap-0">
				{/* Header */}
				<AlertDialogTitle className="p-8 pb-4 relative">
					<button
						className="absolute right-6 top-6 p-2 hover:bg-gray-100 rounded-full transition-colors"
						onClick={onClose}
					>
						<X className="w-6 h-6 text-gray-400" />
					</button>
					<div className="text-3xl  font-bold text-gray-900 mb-2">
						Add Content Block
					</div>
					<p className="text-gray-500 font-sans">
						Configure your new content block
					</p>
				</AlertDialogTitle>

				{draftContent && (
					<ContentInput
						onChange={setDraftContent}
						value={draftContent}
						type={draftContent.type}
					/>
				)}

				{/* Footer */}
				<div className="p-8 pt-4 flex justify-end gap-3">
					<Button onClick={onClose} variant="outline">
						Cancel
					</Button>

					<Button
						disabled={!draftContent || !draftContent.name}
						onClick={handleAdd}
					>
						Add
					</Button>
				</div>
			</AlertDialogContent>
		</AlertDialog>
	);
};

export default ContentInputModal;
