"use client";

import {
	AlertDialog,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useCatalogueContext } from "@/context/CatalogueContext";
import { useEffect, useState } from "react";
import TemplatesInput from "../inputs/TemplatesInput";

const SelectTemplateModal = () => {
	const { catalogue } = useCatalogueContext();
	const [isOpen, setIsOpen] = useState(false);

	useEffect(() => {
		// Open modal if content is empty
		if (catalogue.content.length === 0) {
			setIsOpen(true);
		} else {
			// Ensure it closes if content is populated (e.g. by other means)
			// But we might want to let the user dismiss it manually if we added a cancel button.
			// Here we rely on selection to close.
			setIsOpen(false);
		}
	}, [catalogue.content.length]);

	const handleComplete = () => {
		setIsOpen(false);
	};

	return (
		<AlertDialog open={isOpen}>
			<AlertDialogContent className="max-w-[95vw] md:max-w-4xl w-full p-0 overflow-hidden bg-white border-none shadow-2xl rounded-3xl max-h-[95vh]">
				<div className="p-3 sm:p-6 md:p-8 pb-2 sm:pb-0 text-center">
					<AlertDialogHeader className="mb-1 sm:mb-2">
						<AlertDialogTitle className="text-xl sm:text-2xl md:text-3xl font-heading font-bold text-center w-full">
							Choose a Template
						</AlertDialogTitle>
						<AlertDialogDescription className="text-center w-full text-xs sm:text-sm md:text-base">
							Start with a pre-made layout or build from scratch
						</AlertDialogDescription>
					</AlertDialogHeader>
				</div>

				<div className="flex-1 overflow-y-auto pb-3 sm:pb-4">
					<TemplatesInput onComplete={handleComplete} />
				</div>
			</AlertDialogContent>
		</AlertDialog>
	);
};

export default SelectTemplateModal;
