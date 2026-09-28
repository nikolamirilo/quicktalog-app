import { getCurrencySymbol } from "@/lib/format/price";
import {
	type DisplayItem,
	INITIAL_ITEM_COUNT,
	LOAD_MORE_STEP,
} from "@/lib/catalogue/items";
import { AnyItemsBlock } from "@quicktalog/common";
import { AnimatePresence, motion } from "framer-motion";
import { Plus } from "lucide-react";
import { useState } from "react";
import "swiper/css";
import "swiper/css/pagination";
import { Swiper, SwiperSlide } from "swiper/react";
import CardsSwitcher from "@/components/catalogue/cards";

const getGridStyle = (variant: string): string => {
	switch (variant) {
		case "variant_1":
			return "grid grid-cols-1 px-1 md:grid-cols-2 gap-3 my-1";
		case "variant_2":
			return "flex flex-wrap px-1 justify-start gap-3 mx-auto sm:gap-4 md:gap-6 my-1";
		case "variant_3":
			return "grid grid-cols-1 px-1 md:grid-cols-2 gap-3 my-1";
		case "variant_4":
			return "";
		default:
			return "flex flex-row flex-wrap gap-3 my-1";
	}
};

const contentVariants = {
	hidden: { height: 0, opacity: 0, marginTop: 0 },
	visible: { height: "auto", opacity: 1, marginTop: 16 },
};

interface Props {
	block: AnyItemsBlock;
	displayItems: DisplayItem[];
	blockIndex: number;
	/** Referenced by the section header's `aria-controls`. */
	contentId?: string;
	currentLayout: string;
	currency: string;
	locale?: string;
	mode: string;
	showContent: boolean;
	theme: string;
	onAddItem?: (blockIndex: number) => void;
	onDeleteItem?: (itemIndex: number) => void;
	onEditItem?: (itemIndex: number) => void;
	onMoveItemUp?: (itemIndex: number) => void;
	onMoveItemDown?: (itemIndex: number) => void;
}

const Items = ({
	block,
	displayItems,
	blockIndex,
	contentId,
	currentLayout,
	currency,
	locale,
	mode,
	showContent,
	theme,
	onAddItem,
	onDeleteItem,
	onEditItem,
	onMoveItemUp,
	onMoveItemDown,
}: Props) => {
	const [visibleCount, setVisibleCount] = useState(INITIAL_ITEM_COUNT);

	const totalItemsInBlock = (block.items || []).length;
	const visible = displayItems.slice(0, visibleCount);
	const remaining = displayItems.length - visible.length;

	const handleShowMore = () => setVisibleCount((c) => c + LOAD_MORE_STEP);

	const addCardSize =
		currentLayout === "variant_2"
			? "w-[45%] max-w-[180px] sm:max-w-[220px] md:max-w-[260px] aspect-[3/4]"
			: currentLayout === "variant_3"
				? "w-full min-h-[100px]"
				: "w-full min-h-[110px] sm:min-h-[150px]";

	return (
		<AnimatePresence initial={false}>
			{showContent && (
				<motion.div
					animate="visible"
					aria-label={`${block.name} items`}
					className="overflow-hidden my-2"
					exit="hidden"
					id={contentId}
					initial="hidden"
					key="content"
					role="region"
					transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
					variants={contentVariants}
				>
					{currentLayout === "variant_4" ? (
						<div className="flex flex-col gap-4">
							<Swiper
								aria-label={`${block.name} carousel`}
								className="px-0 sm:px-2 py-2 w-full"
								role="region"
								slidesPerView="auto"
								spaceBetween={12}
							>
								{visible.map(({ item: record, originalIndex }) => (
									<SwiperSlide
										aria-label={`Item ${originalIndex + 1} of ${totalItemsInBlock}`}
										className="!w-[220px] md:!w-[240px] py-2 flex-shrink-0 flex flex-col !h-auto"
										key={record.id || originalIndex}
										role="group"
									>
										<CardsSwitcher
											blockIndex={blockIndex}
											currency={getCurrencySymbol(currency)}
											i={originalIndex}
											isFirst={originalIndex === 0}
											isLast={originalIndex === totalItemsInBlock - 1}
											locale={locale}
											mode={mode}
											onDelete={
												onDeleteItem
													? () => onDeleteItem(originalIndex)
													: undefined
											}
											onEdit={
												onEditItem ? () => onEditItem(originalIndex) : undefined
											}
											onMoveDown={
												onMoveItemDown
													? () => onMoveItemDown(originalIndex)
													: undefined
											}
											onMoveUp={
												onMoveItemUp
													? () => onMoveItemUp(originalIndex)
													: undefined
											}
											record={record}
											theme={theme}
											variant={currentLayout}
										/>
									</SwiperSlide>
								))}
								{mode === "edit" && onAddItem && (
									<SwiperSlide className="!w-[220px] md:!w-[240px] py-2 flex-shrink-0 flex flex-col !h-auto">
										<button
											className="h-full min-h-[300px] w-full border-2 border-dashed border-[var(--catalogue-text)]/20 bg-[var(--catalogue-card-background)]/50 hover:bg-[var(--catalogue-section-background)] hover:border-[var(--catalogue-primary)] hover:scale-[1.01] transition-all duration-200 flex flex-col items-center justify-center p-6 group cursor-pointer"
											onClick={() => onAddItem(blockIndex)}
											style={{ borderRadius: "var(--border-radius)" }}
										>
											<div className="h-12 w-12 rounded-full bg-[var(--catalogue-card-background)] border border-[var(--catalogue-card-border)] flex items-center justify-center mb-3 shadow-sm group-hover:border-[var(--catalogue-primary)] transition-colors">
												<Plus className="w-6 h-6 text-[var(--catalogue-text)]/70 group-hover:text-[var(--catalogue-primary)] transition-colors" />
											</div>
											<span className="text-xl font-medium font-lora text-[var(--catalogue-text)] group-hover:text-[var(--catalogue-heading)] ">
												Add New Item
											</span>
										</button>
									</SwiperSlide>
								)}
							</Swiper>
						</div>
					) : (
						<div>
							<div className={getGridStyle(currentLayout)}>
								{visible.map(({ item: record, originalIndex }) => (
									<CardsSwitcher
										blockIndex={blockIndex}
										currency={getCurrencySymbol(currency)}
										i={originalIndex}
										isFirst={originalIndex === 0}
										isLast={originalIndex === totalItemsInBlock - 1}
										key={record.id || originalIndex}
										locale={locale}
										mode={mode}
										onDelete={
											onDeleteItem
												? () => onDeleteItem(originalIndex)
												: undefined
										}
										onEdit={
											onEditItem ? () => onEditItem(originalIndex) : undefined
										}
										onMoveDown={
											onMoveItemDown
												? () => onMoveItemDown(originalIndex)
												: undefined
										}
										onMoveUp={
											onMoveItemUp
												? () => onMoveItemUp(originalIndex)
												: undefined
										}
										record={record}
										theme={theme}
										variant={currentLayout}
									/>
								))}

								{mode === "edit" && onAddItem && (
									<button
										className={`group relative flex flex-col items-center justify-center p-6 border-2 border-dashed border-catalogue-text/20 bg-[var(--catalogue-card-background)]/50 hover:bg-[var(--catalogue-section-background)] hover:border-[var(--catalogue-primary)] hover:scale-[1.01] transition-all duration-200 cursor-pointer
												${addCardSize}
											`}
										onClick={() => onAddItem(blockIndex)}
										style={{ borderRadius: "var(--border-radius)" }}
									>
										<div className="h-12 w-12 rounded-full bg-[var(--catalogue-card-background)] border border-[var(--catalogue-card-border)] flex items-center justify-center mb-3 shadow-sm group-hover:border-[var(--catalogue-primary)] transition-colors">
											<Plus className="w-6 h-6 text-[var(--catalogue-text)]/70 group-hover:text-[var(--catalogue-primary)] transition-colors" />
										</div>
										<span className="text-xl font-medium font-lora text-[var(--catalogue-text)] group-hover:text-[var(--catalogue-heading)] ">
											Add New Item
										</span>
									</button>
								)}
							</div>
						</div>
					)}

					{remaining > 0 && (
						<div className="flex justify-center mt-4">
							<button
								aria-label={`Show ${Math.min(remaining, LOAD_MORE_STEP)} more items in ${block.name}`}
								className="px-5 py-2 rounded-full border border-[var(--catalogue-card-border)] bg-[var(--catalogue-card-background)] text-[var(--catalogue-text)] hover:bg-[var(--catalogue-section-background)] hover:border-[var(--catalogue-primary)] transition-colors text-sm font-medium"
								onClick={handleShowMore}
								style={{ borderRadius: "var(--border-radius)" }}
								type="button"
							>
								Show more ({remaining} remaining)
							</button>
						</div>
					)}
				</motion.div>
			)}
		</AnimatePresence>
	);
};

export default Items;
