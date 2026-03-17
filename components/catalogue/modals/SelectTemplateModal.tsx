"use client";

import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
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
	const { catalogue, setIsSidebarOpen } = useCatalogueContext();
	const [internalIsOpen, setInternalIsOpen] = useState(false);
	const hasAutoOpened = useRef(false);

	// Determine if the modal should be open based on external or internal state
	const isOpen = externalIsOpen !== undefined ? externalIsOpen : internalIsOpen;

	useEffect(() => {
		if (isOpen) {
			setIsSidebarOpen?.(false);
		}
	}, [isOpen, setIsSidebarOpen]);

	// Helper to handle closing the modal correctly
	const handleClose = () => {
		if (externalOnClose) {
			externalOnClose();
		} else {
			setInternalIsOpen(false);
		}
	};

	useEffect(() => {
		if (externalIsOpen === undefined && !hasAutoOpened.current) {
			if (!catalogue.id) return;

			if (catalogue.content && catalogue.content.length === 0) {
				setInternalIsOpen(true);
			}
			hasAutoOpened.current = true; // Mark as checked regardless of whether we opened it or not
		}
	}, [externalIsOpen, catalogue]);

	const handleComplete = () => {
		handleClose();
	};

	return (
		<Dialog onOpenChange={(open) => !open && handleClose()} open={isOpen}>
			<DialogContent
				className="fixed w-[95vw] h-fit sm:h-fit left-[50%] top-[50%] translate-x-[-50%] translate-y-[-50%] rounded-3xl sm:max-w-[95vw] sm:max-h-[95vh] md:max-w-5xl p-0 overflow-hidden bg-white border-none shadow-2xl flex flex-col"
				showClose={false}
			>
				{/* Dismiss button - show if externally controlled or if we want to allow dismissal */}
				{(externalIsOpen !== undefined || internalIsOpen) && (
					<button
						className="absolute right-4 top-4 p-2 rounded-full hover:bg-gray-100 transition-colors z-[60]"
						onClick={handleClose}
					>
						<X className="w-5 h-5 text-gray-500" />
					</button>
				)}

				<div className="p-2 sm:p-4 md:p-6 pb-2 sm:pb-0 text-center flex-shrink-0 pt-10 sm:pt-6">
					<DialogHeader className="mb-1 sm:mb-2">
						<DialogTitle className="text-xl sm:text-2xl md:text-3xl font-heading font-bold text-center w-full">
							Choose a Template
						</DialogTitle>
						<DialogDescription className="text-center w-full text-xs sm:text-sm md:text-base">
							Start with a pre-made layout or build from scratch
						</DialogDescription>
					</DialogHeader>
				</div>

				<div className="flex-1 overflow-y-auto pb-2 sm:pb-4 -webkit-overflow-touch: touch">
					<TemplatesInput onComplete={handleComplete} />
				</div>
			</DialogContent>
		</Dialog>
	);
};

export default SelectTemplateModal;
