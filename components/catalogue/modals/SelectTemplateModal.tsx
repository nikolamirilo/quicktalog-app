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
			<AlertDialogContent className="max-w-[95vw] w-fit p-0 overflow-hidden bg-white border-none shadow-2xl rounded-3xl">
				<div className="p-8 pb-0 text-center">
					<AlertDialogHeader className="mb-2">
						<AlertDialogTitle className="text-3xl font-heading font-bold text-center w-full">
							Choose a Template
						</AlertDialogTitle>
						<AlertDialogDescription className="text-center w-full text-lg">
							Start with a pre-made layout or build from scratch
						</AlertDialogDescription>
					</AlertDialogHeader>
				</div>

				<div className="max-h-[85vh] overflow-y-auto pb-4">
					<TemplatesInput onComplete={handleComplete} />
				</div>
			</AlertDialogContent>
		</AlertDialog>
	);
};

export default SelectTemplateModal;
