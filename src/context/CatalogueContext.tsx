"use client";
import {
	applyCatalogueOperations,
	type OperationLimits,
	type OperationOutcome,
} from "@/lib/catalogue/operations";
import { isItemsBlock } from "@/lib/catalogue/content-blocks";
import { CUSTOM_THEME_NAME } from "@/lib/themes/custom-theme";
import type { CatalogueOperation } from "@/types/ai";
import {
	Catalogue,
	ContentBlock,
	type CustomThemeColors,
	defaultCatalogueData,
	Item,
} from "@quicktalog/common";
import { createContext, useContext, useEffect, useRef, useState } from "react";

/** AI chat edits waiting for the owner to keep or undo. */
export interface AiReview {
	/** The catalogue as it was before the first edit under review. */
	before: Catalogue;
	/** What landed, one line per edit, in order. */
	changes: string[];
}

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
	/**
	 * The template picker is up. Quick AI stays out of the way while it is, so a
	 * new catalogue doesn't open with the picker and the chat on screen together.
	 */
	isTemplatePickerOpen: boolean;
	setIsTemplatePickerOpen: (open: boolean) => void;
	/**
	 * Content edits address a section and an item by id, never by position: the
	 * agent's edits land on the draft while a dialog is open, so a position read
	 * when it opened can be pointing at a different section by the time it
	 * saves. An id that is no longer there is dropped.
	 */
	addBlock: (block: ContentBlock, index?: number) => void;
	removeBlock: (blockId: string) => void;
	updateBlock: (blockId: string, data: Partial<ContentBlock>) => void;
	moveBlock: (blockId: string, direction: "up" | "down") => void;
	addItem: (blockId: string, item: Item) => void;
	updateItem: (blockId: string, itemId: string, item: Item) => void;
	removeItem: (blockId: string, itemId: string) => void;
	moveItem: (blockId: string, itemId: string, direction: "up" | "down") => void;
	moveItemToBlock: (
		fromBlockId: string,
		itemId: string,
		toBlockId: string,
	) => void;
	applyOperations: (
		operations: CatalogueOperation[],
		limits?: OperationLimits,
	) => OperationOutcome;
	/**
	 * AI chat edits the owner hasn't kept or undone yet, or null. They land on
	 * the draft straight away and are highlighted; Reject puts back `before`.
	 */
	aiReview: AiReview | null;
	/**
	 * `applyOperations` for the AI chat: the edits also go up for review. The
	 * limits are required, so an agent edit can never land on the draft ungated.
	 */
	applyAiOperations: (
		operations: CatalogueOperation[],
		limits: OperationLimits,
	) => OperationOutcome;
	/** The latest draft, including edits applied earlier in the same render pass. */
	getCatalogue: () => Omit<Catalogue, "id">;
	/** Loads a stored catalogue into the builder; it counts as saved. */
	seedCatalogue: (catalogue: Catalogue) => void;
	/** Records `saved` (the current draft by default) as what the server holds. */
	markSaved: (saved?: Omit<Catalogue, "id">) => void;
	/** Applies a change the server has already stored (going live), keeping the draft saved. */
	patchSaved: (partial: Partial<Catalogue>) => void;
	/** The draft differs from what was last seeded or saved. */
	isDirty: boolean;
	/** Keeps the edits under review. */
	acceptAiChanges: () => void;
	/** Puts the catalogue back to how it was before the edits under review. */
	rejectAiChanges: () => void;
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
	const [isTemplatePickerOpen, setIsTemplatePickerOpen] = useState(false);

	/**
	 * The draft itself, not a mirror of the last render: every writer reads and
	 * writes it through `commit`, so two edits in the same tick - a hand edit and
	 * an agent edit arriving on the same stream chunk - compose instead of one
	 * overwriting the other, and `applyOperations` can still return its outcome
	 * synchronously.
	 */
	const catalogueRef = useRef(catalogue);

	const commit = (
		next: (prev: Omit<Catalogue, "id">) => Omit<Catalogue, "id">,
	): Omit<Catalogue, "id"> => {
		const value = next(catalogueRef.current);
		if (value === catalogueRef.current) return value;
		catalogueRef.current = value;
		setCatalogue(value);
		return value;
	};

	/** A content edit, or `null` from `change` when the target is gone. */
	const commitContent = (
		change: (content: ContentBlock[]) => ContentBlock[] | null,
	) =>
		commit((prev) => {
			const content = change(prev.content);
			return content ? { ...prev, content } : prev;
		});

	const commitItems = (
		blockId: string,
		change: (items: Item[]) => Item[] | null,
	) =>
		commitContent((content) => {
			const index = content.findIndex((block) => block.id === blockId);
			const block = index < 0 ? undefined : content[index];
			if (!block || !isItemsBlock(block)) return null;
			const items = change(block.items ?? []);
			if (!items) return null;
			const next = [...content];
			next[index] = { ...block, items } as ContentBlock;
			return next;
		});

	// Compared by identity: every edit makes a new object, and an undo restores the old one.
	const [savedCatalogue, setSavedCatalogue] = useState<unknown>(null);
	const isDirty = savedCatalogue !== null && catalogue !== savedCatalogue;

	const seedCatalogue = (next: Catalogue) => {
		commit(() => next);
		setSavedCatalogue(next);
	};

	const patchSaved = (partial: Partial<Catalogue>) => {
		setSavedCatalogue(commit((prev) => ({ ...prev, ...partial })));
	};

	const markSaved = (saved: Omit<Catalogue, "id"> = catalogueRef.current) => {
		setSavedCatalogue(saved);
	};

	const resetCatalogue = () => {
		commit(() => defaultCatalogueData);
		setSavedCatalogue(null);
	};

	const updateCatalogue = (partial: Partial<Catalogue>) => {
		commit((prev) => ({ ...prev, ...partial }));
	};

	const addBlock = (block: ContentBlock, index?: number) => {
		commitContent((content) => {
			const next = [...content];
			const at =
				index !== undefined && index >= 0 && index <= next.length
					? index
					: next.length;
			next.splice(at, 0, { ...block, order: at });
			return reorderArray(next);
		});
	};

	const removeBlock = (blockId: string) => {
		commitContent((content) => {
			const next = content.filter((block) => block.id !== blockId);
			return next.length === content.length ? null : reorderArray(next);
		});
	};

	const updateBlock = (blockId: string, data: Partial<ContentBlock>) => {
		commitContent((content) => {
			const index = content.findIndex((block) => block.id === blockId);
			if (index < 0) return null;
			const next = [...content];
			next[index] = { ...next[index], ...data } as ContentBlock;
			return next;
		});
	};

	const moveBlock = (blockId: string, direction: "up" | "down") => {
		commitContent((content) => {
			const index = content.findIndex((block) => block.id === blockId);
			const target = direction === "up" ? index - 1 : index + 1;
			if (index < 0 || target < 0 || target >= content.length) return null;
			const next = [...content];
			[next[index], next[target]] = [next[target], next[index]];
			return reorderArray(next);
		});
	};

	const addItem = (blockId: string, item: Item) => {
		commitItems(blockId, (items) => [
			...items,
			{ ...item, order: items.length },
		]);
	};

	const updateItem = (blockId: string, itemId: string, item: Item) => {
		commitItems(blockId, (items) => {
			const index = items.findIndex((entry) => entry.id === itemId);
			if (index < 0) return null;
			const next = [...items];
			next[index] = { ...item, id: itemId, order: items[index].order };
			return next;
		});
	};

	const removeItem = (blockId: string, itemId: string) => {
		commitItems(blockId, (items) => {
			const next = items.filter((entry) => entry.id !== itemId);
			return next.length === items.length ? null : reorderArray(next);
		});
	};

	const moveItem = (
		blockId: string,
		itemId: string,
		direction: "up" | "down",
	) => {
		commitItems(blockId, (items) => {
			const index = items.findIndex((entry) => entry.id === itemId);
			const target = direction === "up" ? index - 1 : index + 1;
			if (index < 0 || target < 0 || target >= items.length) return null;
			const next = [...items];
			[next[index], next[target]] = [next[target], next[index]];
			return reorderArray(next);
		});
	};

	const moveItemToBlock = (
		fromBlockId: string,
		itemId: string,
		toBlockId: string,
	) => {
		commitContent((content) => {
			const fromIndex = content.findIndex((block) => block.id === fromBlockId);
			const toIndex = content.findIndex((block) => block.id === toBlockId);
			const from = fromIndex < 0 ? undefined : content[fromIndex];
			const to = toIndex < 0 ? undefined : content[toIndex];
			if (
				!from ||
				!to ||
				fromIndex === toIndex ||
				!isItemsBlock(from) ||
				!isItemsBlock(to)
			) {
				return null;
			}

			const fromItems = [...(from.items ?? [])];
			const index = fromItems.findIndex((entry) => entry.id === itemId);
			if (index < 0) return null;
			const [moved] = fromItems.splice(index, 1);
			const toItems = [...(to.items ?? []), moved];

			const next = [...content];
			next[fromIndex] = {
				...from,
				items: reorderArray(fromItems),
			} as ContentBlock;
			next[toIndex] = { ...to, items: reorderArray(toItems) } as ContentBlock;
			return next;
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
		if (outcome.applied.length > 0) commit(() => outcome.catalogue);
		return outcome;
	};

	const [aiReview, setAiReview] = useState<AiReview | null>(null);
	// Refs mirror the review so several edits applied in one pass stack up
	// synchronously, before React re-renders.
	const aiReviewRef = useRef<AiReview | null>(null);
	/** The catalogue the last AI edit produced. Any other change is a hand edit. */
	const lastAiCatalogue = useRef<unknown>(null);

	const clearAiReview = () => {
		aiReviewRef.current = null;
		lastAiCatalogue.current = null;
		setAiReview(null);
	};

	const applyAiOperations = (
		operations: CatalogueOperation[],
		limits: OperationLimits,
	): OperationOutcome => {
		const before = catalogueRef.current as Catalogue;
		const outcome = applyOperations(operations, limits);
		if (outcome.applied.length > 0) {
			const review: AiReview = {
				before: aiReviewRef.current?.before ?? before,
				changes: [...(aiReviewRef.current?.changes ?? []), ...outcome.applied],
			};
			aiReviewRef.current = review;
			lastAiCatalogue.current = outcome.catalogue;
			setAiReview(review);
		}
		return outcome;
	};

	const acceptAiChanges = () => {
		if (aiReviewRef.current) clearAiReview();
	};

	const rejectAiChanges = () => {
		const review = aiReviewRef.current;
		if (!review) return;
		clearAiReview();
		commit(() => review.before);
	};

	// A hand edit made while a review is open keeps the AI edits: undoing them
	// afterwards would throw the hand edit away along with them.
	useEffect(() => {
		if (aiReviewRef.current && catalogue !== lastAiCatalogue.current) {
			clearAiReview();
		}
	}, [catalogue]);

	const updateAppearance = (
		partial: Partial<Catalogue["appearance"]["style"]>,
	) => {
		commit((prev) => ({
			...prev,
			appearance: {
				...prev.appearance,
				style: { ...prev.appearance.style, ...partial },
			},
		}));
	};

	const updateThemeColors = (colors: CustomThemeColors) => {
		commit((prev) => ({
			...prev,
			appearance: {
				...prev.appearance,
				theme: { type: "custom", name: CUSTOM_THEME_NAME, colors },
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
				isTemplatePickerOpen,
				setIsTemplatePickerOpen,
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
				aiReview,
				applyAiOperations,
				getCatalogue: () => catalogueRef.current,
				seedCatalogue,
				markSaved,
				patchSaved,
				isDirty,
				acceptAiChanges,
				rejectAiChanges,
			}}
		>
			{children}
		</CatalogueContext.Provider>
	);
};
