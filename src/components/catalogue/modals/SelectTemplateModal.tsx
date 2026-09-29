"use client";

import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogClose,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { useCatalogueContext } from "@/context/CatalogueContext";
import { X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import TemplatesInput from "@/components/catalogue/inputs/TemplatesInput";

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

	const isOpen = externalIsOpen !== undefined ? externalIsOpen : internalIsOpen;

	useEffect(() => {
		if (isOpen) {
			setIsSidebarOpen?.(false);
		}
	}, [isOpen, setIsSidebarOpen]);

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
				className="flex max-h-[calc(100dvh-24px)] w-[calc(100vw-24px)] max-w-5xl flex-col gap-0 overflow-hidden p-0"
				showClose={false}
			>
				<div className="flex flex-none items-start justify-between gap-3 px-5 pb-4 pt-5 sm:px-6 md:pt-6">
					<DialogHeader className="min-w-0 space-y-1 text-left sm:text-left">
						<DialogTitle className="text-xl sm:text-2xl">
							Choose a Template
						</DialogTitle>
						<DialogDescription className="text-sm sm:text-[15px]">
							Start with a pre-made layout or build from scratch
						</DialogDescription>
					</DialogHeader>
					<DialogClose asChild>
						<Button
							aria-label="Close"
							className="-mr-2 -mt-1 flex-none"
							size="icon"
							variant="ghost"
						>
							<X aria-hidden="true" className="!size-5" />
						</Button>
					</DialogClose>
				</div>

				<div className="min-h-0 flex-1 overflow-y-auto overscroll-contain pb-4 pt-1 sm:pb-6 [-webkit-overflow-scrolling:touch]">
					<TemplatesInput onComplete={handleComplete} />
				</div>
			</DialogContent>
		</Dialog>
	);
};

export default SelectTemplateModal;
