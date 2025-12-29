import { AnimatePresence, motion } from "framer-motion";
import { Plus } from "lucide-react";
import { Swiper, SwiperSlide } from "swiper/react";
import {
	contentVariants,
	getCurrencySymbol,
	getGridStyle,
} from "@/helpers/client";
import "swiper/css";
import "swiper/css/pagination";
import { CategoryBlock, ContainerBlock } from "@/types/catalogue";
import CardsSwitcher from "./cards";

interface Props {
	block: ContainerBlock | CategoryBlock;
	blockIndex: number;
	currentLayout: string;
	currency: string;
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
	blockIndex,
	currentLayout,
	currency,
	mode,
	showContent,
	theme,
	onAddItem,
	onDeleteItem,
	onEditItem,
	onMoveItemUp,
	onMoveItemDown,
}: Props) => {
	return (
		<AnimatePresence initial={false}>
			{showContent && (
				<motion.div
					animate="visible"
					aria-label={`${block.name} items`}
					className="overflow-hidden my-2"
					exit="hidden"
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
								{(block.items || []).map((record, i) => (
									<SwiperSlide
										aria-label={`Item ${i + 1} of ${(block.items || []).length}`}
										className="!w-[220px] md:!w-[240px] py-2 flex-shrink-0 flex flex-col !h-auto"
										key={record.name}
										role="group"
									>
										<CardsSwitcher
											currency={getCurrencySymbol(currency)}
											i={i}
											record={record}
											theme={theme}
											variant={currentLayout}
											mode={mode}
											onDelete={
												onDeleteItem ? () => onDeleteItem(i) : undefined
											}
											onEdit={onEditItem ? () => onEditItem(i) : undefined}
											onMoveUp={
												onMoveItemUp ? () => onMoveItemUp(i) : undefined
											}
											onMoveDown={
												onMoveItemDown ? () => onMoveItemDown(i) : undefined
											}
											isFirst={i === 0}
											isLast={i === (block.items || []).length - 1}
										/>
									</SwiperSlide>
								))}
								{mode === "edit" && onAddItem && (
									<SwiperSlide className="!w-[220px] md:!w-[240px] py-2 flex-shrink-0 flex flex-col !h-auto">
										<button
											className="h-full min-h-[300px] w-full border-2 border-dashed border-gray-700 bg-gray-100/30 rounded-xl hover:bg-[#FFFCF1] hover:border-[#FCD34D] hover:scale-[1.01] transition-all duration-200 flex flex-col items-center justify-center p-6 group cursor-pointer"
											onClick={() => onAddItem(blockIndex)}
										>
											<div className="h-12 w-12 rounded-full bg-white border border-gray-200 flex items-center justify-center mb-3 shadow-sm group-hover:border-[#FCD34D] transition-colors">
												<Plus className="w-6 h-6 text-gray-600 group-hover:text-[#FCD34D] transition-colors" />
											</div>
											<span className="text-xl font-medium text-gray-800 group-hover:text-gray-900 ">
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
								{(block.items || []).map((record, i) => (
									<CardsSwitcher
										currency={getCurrencySymbol(currency)}
										i={i}
										key={record.name}
										record={record}
										theme={theme}
										variant={currentLayout}
										mode={mode}
										onDelete={onDeleteItem ? () => onDeleteItem(i) : undefined}
										onEdit={onEditItem ? () => onEditItem(i) : undefined}
										onMoveUp={onMoveItemUp ? () => onMoveItemUp(i) : undefined}
										onMoveDown={
											onMoveItemDown ? () => onMoveItemDown(i) : undefined
										}
										isFirst={i === 0}
										isLast={i === (block.items || []).length - 1}
									/>
								))}

								{mode === "edit" && onAddItem && (
									<button
										className={`group relative flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-700 bg-gray-100/30 rounded-xl hover:bg-[#FFFCF1] hover:border-[#FCD34D] hover:scale-[1.01] transition-all duration-200 cursor-pointer 
												${
													currentLayout === "variant_2"
														? "w-[45%] max-w-[180px] sm:max-w-[220px] md:max-w-[260px] aspect-[3/4]"
														: currentLayout === "variant_3"
															? "w-full min-h-[100px]"
															: "w-full min-h-[110px] sm:min-h-[150px]"
												}
											`}
										onClick={() => onAddItem(blockIndex)}
									>
										<div className="h-12 w-12 rounded-full bg-white border border-gray-200 flex items-center justify-center mb-3 shadow-sm group-hover:border-[#FCD34D] transition-colors">
											<Plus className="w-6 h-6 text-gray-600 group-hover:text-[#FCD34D] transition-colors" />
										</div>
										<span className="text-xl font-medium text-gray-800 group-hover:text-gray-900 ">
											Add New Item
										</span>
									</button>
								)}
							</div>
						</div>
					)}
				</motion.div>
			)}
		</AnimatePresence>
	);
};

export default Items;
