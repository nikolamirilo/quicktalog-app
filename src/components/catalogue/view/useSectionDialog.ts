"use client";
import type { ContentBlock } from "@quicktalog/common";
import { useState } from "react";

export interface SectionDialog {
	/** The section being edited, or null when the dialog is adding one. */
	editingBlock: ContentBlock | null;
	isOpen: boolean;
	openAdd: () => void;
	openEdit: (block: ContentBlock) => void;
	close: () => void;
}

/**
 * Which section the Add/Edit dialog is working on. One way in and one way out:
 * opening to add clears the target and closing always clears it, so a saved
 * edit can never leave its target behind for the next "Add section" to write
 * over - which is exactly what used to happen, because saving closed the
 * dialog without going through its close.
 */
export function useSectionDialog(): SectionDialog {
	const [isOpen, setIsOpen] = useState(false);
	const [editingBlock, setEditingBlock] = useState<ContentBlock | null>(null);

	return {
		editingBlock,
		isOpen,
		openAdd: () => {
			setEditingBlock(null);
			setIsOpen(true);
		},
		openEdit: (block: ContentBlock) => {
			setEditingBlock(block);
			setIsOpen(true);
		},
		close: () => {
			setIsOpen(false);
			setEditingBlock(null);
		},
	};
}
