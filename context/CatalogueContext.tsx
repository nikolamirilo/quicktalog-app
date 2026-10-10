"use client";
import { useUser } from "@clerk/nextjs";
import {
	Catalogue,
	ContentBlock,
	defaultCatalogueData,
	Item,
} from "@quicktalog/common";
import { createContext, useContext, useEffect, useState } from "react";

interface CatalogueContextType {
	catalogue: Catalogue;
	resetCatalogue: () => void;
	updateCatalogue: (partial: Partial<Catalogue>) => void;
	updateAppearance: (
		partial: Partial<Catalogue["appearance"]["style"]>,
	) => void;
	// Sidebar state
	isSidebarOpen: boolean;
	setIsSidebarOpen: (open: boolean) => void;
	// Block actions
	addBlock: (block: ContentBlock, index?: number) => void;
	removeBlock: (index: number) => void;
	updateBlock: (index: number, data: Partial<ContentBlock>) => void;
	moveBlock: (index: number, direction: "up" | "down") => void;
	// Item actions
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
	const { user } = useUser();

	const resetCatalogue = () => {
		setCatalogue(defaultCatalogueData);
	};

	const updateCatalogue = (partial: Partial<Catalogue>) => {
		setCatalogue((prev) => ({
			...prev,
			...partial,
		}));
	};

	// Block Actions
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
			// Re-order remaining sections
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

			// Bounds check
			if (targetIndex < 0 || targetIndex >= newContent.length) {
				return prev;
			}

			// Swap sections
			[newContent[index], newContent[targetIndex]] = [
				newContent[targetIndex],
				newContent[index],
			];

			// Re-order all sections
			return { ...prev, content: reorderArray(newContent) };
		});
	};

	// Item Actions
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
				// Re-order remaining items
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

				// Bounds check
				if (targetIndex < 0 || targetIndex >= newItems.length) {
					return prev;
				}

				// Swap items
				[newItems[itemIndex], newItems[targetIndex]] = [
					newItems[targetIndex],
					newItems[itemIndex],
				];

				// Re-order all items
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

	useEffect(() => {
		if (user && user.id !== catalogue.createdBy) {
			updateCatalogue({
				createdBy: user.id,
			});
		}
	}, [user, catalogue.createdBy]);

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

	return (
		<CatalogueContext.Provider
			value={{
				catalogue: catalogue as Catalogue,
				resetCatalogue,
				updateCatalogue,
				updateAppearance,
				isSidebarOpen,
				setIsSidebarOpen,
				addBlock,
				removeBlock,
				updateBlock,
				moveBlock,
				addItem,
				updateItem,
				removeItem,
				moveItem,
				moveItemToBlock,
			}}
		>
			{children}
		</CatalogueContext.Provider>
	);
};
