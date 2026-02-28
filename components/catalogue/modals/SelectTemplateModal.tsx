"use client";

import {
	AlertDialog,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useCatalogueContext } from "@/context/CatalogueContext";
import { X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import TemplatesInput from "../inputs/TemplatesInput";

interface SelectTemplateModalProps {
	isOpen?: boolean;
	onClose?: () => void;
}

const SelectTemplateModal = ({
	isOpen: externalIsOpen,
	onClose: externalOnClose,
}: SelectTemplateModalProps = {}) => {
	const { catalogue } = useCatalogueContext();
	const [internalIsOpen, setInternalIsOpen] = useState(false);
	const hasAutoOpened = useRef(false);

	// Determine if the modal should be open based on external or internal state
	const isOpen = externalIsOpen !== undefined ? externalIsOpen : internalIsOpen;

	// Helper to handle closing the modal correctly
	const handleClose = () => {
		if (externalOnClose) {
			externalOnClose();
		} else {
			setInternalIsOpen(false);
		}
	};

	useEffect(() => {
		// Only check auto-open if not externally controlled
		if (externalIsOpen === undefined && !hasAutoOpened.current) {
			if (catalogue.content.length === 0) {
				setInternalIsOpen(true);
				hasAutoOpened.current = true;
			}
		}
	}, [catalogue.content.length, externalIsOpen]);

	const handleComplete = () => {
		handleClose();
	};

	return (
		<AlertDialog onOpenChange={(open) => !open && handleClose()} open={isOpen}>
			<AlertDialogContent className="fixed w-full max-h-[100dvh] h-[100dvh] sm:h-fit left-0 top-0 translate-x-0 translate-y-0 rounded-none sm:left-[50%] sm:top-[50%] sm:translate-x-[-50%] sm:translate-y-[-50%] sm:max-w-[95vw] sm:max-h-[95vh] sm:rounded-3xl md:max-w-6xl p-0 overflow-hidden bg-white border-none shadow-2xl flex flex-col">
				{/* Dismiss button - show if externally controlled or if we want to allow dismissal */}
				{(externalIsOpen !== undefined || internalIsOpen) && (
					<button
						className="absolute right-4 top-4 p-2 rounded-full hover:bg-gray-100 transition-colors z-[60]"
						onClick={handleClose}
					>
						<X className="w-5 h-5 text-gray-500" />
					</button>
				)}

				<div className="p-4 sm:p-6 md:p-8 pb-2 sm:pb-0 text-center flex-shrink-0 pt-10 sm:pt-6">
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
