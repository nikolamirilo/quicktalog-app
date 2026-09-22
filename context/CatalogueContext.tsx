"use client";
import {
	applyCatalogueOperations,
	type OperationLimits,
	type OperationOutcome,
} from "@/helpers/catalogueOperations";
import { CUSTOM_THEME_NAME } from "@/helpers/theme";
import type { CatalogueOperation } from "@/types/ai";
import {
	Catalogue,
	ContentBlock,
	type CustomThemeColors,
	defaultCatalogueData,
	Item,
} from "@quicktalog/common";
import { createContext, useContext, useRef, useState } from "react";

interface CatalogueContextType {
	catalogue: Catalogue;
	resetCatalogue: () => void;
	updateCatalogue: (partial: Partial<Catalogue>) => void;
	updateAppearance: (
		partial: Partial<Catalogue["appearance"]["style"]>,
	) => void;
	updateThemeColors: (colors: CustomThemeColors) => void;
	isSidebarOpen: boolean;
	setIsSidebarOpen: (open: boolean) => void;
	/**
	 * The AI chat sheet. It lives here rather than inside CatalogueChat because
	 * the builder's bottom bar has to know: on mobile the two share one thumb
	 * zone, so the bar hides itself while the chat is up.
	 */
	isChatOpen: boolean;
	setIsChatOpen: (open: boolean) => void;
	addBlock: (block: ContentBlock, index?: number) => void;
	removeBlock: (index: number) => void;
	updateBlock: (index: number, data: Partial<ContentBlock>) => void;
	moveBlock: (index: number, direction: "up" | "down") => void;
	addItem: (blockIndex: number, item: Item) => void;
	updateItem: (blockIndex: number, itemIndex: number, item: Item) => void;
	removeItem: (blockIndex: number, itemIndex: number) => void;
	moveItem: (
		blockIndex: number,
		itemIndex: number,
		direction: "up" | "down",
	) => void;
	moveItemToBlock: (
		fromBlockIndex: number,
		itemIndex: number,
		toBlockIndex: number,
	) => void;
	applyOperations: (
		operations: CatalogueOperation[],
		limits?: OperationLimits,
	) => OperationOutcome;
}
const CatalogueContext = createContext<CatalogueContextType | null>(null);

export const useCatalogueContext = () => {
	return useContext(CatalogueContext);
};

const reorderArray = <T extends { order: number }>(arr: T[]): T[] => {
	return arr.map((item, index) => ({ ...item, order: index }));
};

export const CatalogueContextProvider = ({
	children,
}: {
	children: React.ReactNode;
}) => {
	const [catalogue, setCatalogue] =
		useState<Omit<Catalogue, "id">>(defaultCatalogueData);
	const [isSidebarOpen, setIsSidebarOpen] = useState(false);
	const [isChatOpen, setIsChatOpen] = useState(false);

	// Mirrors the latest committed catalogue so `applyOperations` can compute and
	// return its outcome synchronously instead of only inside a state updater.
	const catalogueRef = useRef(catalogue);
	catalogueRef.current = catalogue;

	const resetCatalogue = () => {
		setCatalogue(defaultCatalogueData);
	};

	const updateCatalogue = (partial: Partial<Catalogue>) => {
		setCatalogue((prev) => ({
			...prev,
			...partial,
		}));
	};

	const addBlock = (block: ContentBlock, index?: number) => {
		setCatalogue((prev) => {
			const newContent = [...prev.content];
			const blockWithOrder = { ...block, order: newContent.length };
			if (index !== undefined && index >= 0 && index <= newContent.length) {
				newContent.splice(index, 0, blockWithOrder);
			} else {
				newContent.push(blockWithOrder);
			}
			return { ...prev, content: reorderArray(newContent) };
		});
	};

	const removeBlock = (index: number) => {
		setCatalogue((prev) => {
			const newContent = [...prev.content];
			newContent.splice(index, 1);
			return { ...prev, content: reorderArray(newContent) };
		});
	};

	const updateBlock = (index: number, data: Partial<ContentBlock>) => {
		setCatalogue((prev) => {
			const newContent = [...prev.content];
			if (newContent[index]) {
				newContent[index] = { ...newContent[index], ...data } as ContentBlock;
			}
			return { ...prev, content: newContent };
		});
	};

	const moveBlock = (index: number, direction: "up" | "down") => {
		setCatalogue((prev) => {
			const newContent = [...prev.content];
			const targetIndex = direction === "up" ? index - 1 : index + 1;

			if (targetIndex < 0 || targetIndex >= newContent.length) {
				return prev;
			}

			[newContent[index], newContent[targetIndex]] = [
				newContent[targetIndex],
				newContent[index],
			];

			return { ...prev, content: reorderArray(newContent) };
		});
	};

	const addItem = (blockIndex: number, item: Item) => {
		setCatalogue((prev) => {
			const newContent = [...prev.content];
			const originalBlock = newContent[blockIndex];

			if (
				originalBlock &&
				(originalBlock.type === "category" ||
					originalBlock.type === "container")
			) {
				const block = { ...originalBlock };
				const itemWithOrder = { ...item, order: block.items?.length || 0 };
				block.items = block.items
					? [...block.items, itemWithOrder]
					: [itemWithOrder];
				newContent[blockIndex] = block;
			}
			return { ...prev, content: newContent };
		});
	};

	const updateItem = (blockIndex: number, itemIndex: number, item: Item) => {
		setCatalogue((prev) => {
			const newContent = [...prev.content];
			const originalBlock = newContent[blockIndex];
			if (
				originalBlock &&
				(originalBlock.type === "category" ||
					originalBlock.type === "container") &&
				originalBlock.items &&
				originalBlock.items[itemIndex]
			) {
				const block = { ...originalBlock };
				const newItems = [...block.items];
				newItems[itemIndex] = item;
				block.items = newItems;
				newContent[blockIndex] = block;
			}
			return { ...prev, content: newContent };
		});
	};

	const removeItem = (blockIndex: number, itemIndex: number) => {
		setCatalogue((prev) => {
			const newContent = [...prev.content];
			const originalBlock = newContent[blockIndex];
			if (
				originalBlock &&
				(originalBlock.type === "category" ||
					originalBlock.type === "container") &&
				originalBlock.items
			) {
				const block = { ...originalBlock };
				const newItems = [...block.items];
				newItems.splice(itemIndex, 1);
				block.items = reorderArray(newItems);
				newContent[blockIndex] = block;
			}
			return { ...prev, content: newContent };
		});
	};

	const moveItem = (
		blockIndex: number,
		itemIndex: number,
		direction: "up" | "down",
	) => {
		setCatalogue((prev) => {
			const newContent = [...prev.content];
			const originalBlock = newContent[blockIndex];

			if (
				originalBlock &&
				(originalBlock.type === "category" ||
					originalBlock.type === "container") &&
				originalBlock.items
			) {
				const block = { ...originalBlock };
				const newItems = [...block.items];
				const targetIndex = direction === "up" ? itemIndex - 1 : itemIndex + 1;

				if (targetIndex < 0 || targetIndex >= newItems.length) {
					return prev;
				}

				[newItems[itemIndex], newItems[targetIndex]] = [
					newItems[targetIndex],
					newItems[itemIndex],
				];

				block.items = reorderArray(newItems);
				newContent[blockIndex] = block;
			}
			return { ...prev, content: newContent };
		});
	};

	const moveItemToBlock = (
		fromBlockIndex: number,
		itemIndex: number,
		toBlockIndex: number,
	) => {
		setCatalogue((prev) => {
			const newContent = [...prev.content];
			const fromBlock = newContent[fromBlockIndex];
			const toBlock = newContent[toBlockIndex];

			if (
				!fromBlock ||
				!toBlock ||
				!(fromBlock.type === "category" || fromBlock.type === "container") ||
				!(toBlock.type === "category" || toBlock.type === "container") ||
				!fromBlock.items ||
				!fromBlock.items[itemIndex]
			) {
				return prev;
			}

			const fromBlockCopy = { ...fromBlock, items: [...fromBlock.items] };
			const toBlockCopy = { ...toBlock, items: [...(toBlock.items || [])] };

			const [movedItem] = fromBlockCopy.items.splice(itemIndex, 1);
			toBlockCopy.items.push({ ...movedItem, order: toBlockCopy.items.length });

			fromBlockCopy.items = reorderArray(fromBlockCopy.items);
			toBlockCopy.items = reorderArray(toBlockCopy.items);

			newContent[fromBlockIndex] = fromBlockCopy as ContentBlock;
			newContent[toBlockIndex] = toBlockCopy as ContentBlock;

			return { ...prev, content: newContent };
		});
	};

	/**
	 * Applies a batch of AI chat edits in one commit and reports what landed.
	 * Operations are id-addressed, so the whole batch is resolved against a
	 * single snapshot rather than through the index-based actions above.
	 */
	const applyOperations = (
		operations: CatalogueOperation[],
		limits?: OperationLimits,
	): OperationOutcome => {
		const outcome = applyCatalogueOperations(
			catalogueRef.current as Catalogue,
			operations,
			limits,
		);
		if (outcome.applied.length > 0) {
			catalogueRef.current = outcome.catalogue;
			setCatalogue(outcome.catalogue);
		}
		return outcome;
	};

	const updateAppearance = (
		partial: Partial<Catalogue["appearance"]["style"]>,
	) => {
		setCatalogue((prev) => ({
			...prev,
			appearance: {
				...prev.appearance,
				style: {
					...prev.appearance.style,
					...partial,
				},
			},
		}));
	};

	const updateThemeColors = (colors: CustomThemeColors) => {
		setCatalogue((prev) => ({
			...prev,
			appearance: {
				...prev.appearance,
				theme: {
					type: "custom",
					name: CUSTOM_THEME_NAME,
					colors,
				},
			},
		}));
	};

	return (
		<CatalogueContext.Provider
			value={{
				catalogue: catalogue as Catalogue,
				resetCatalogue,
				updateCatalogue,
				updateAppearance,
				updateThemeColors,
				isSidebarOpen,
				setIsSidebarOpen,
				isChatOpen,
				setIsChatOpen,
				addBlock,
				removeBlock,
				updateBlock,
				moveBlock,
				addItem,
				updateItem,
				removeItem,
				moveItem,
				moveItemToBlock,
				applyOperations,
			}}
		>
			{children}
		</CatalogueContext.Provider>
	);
};
