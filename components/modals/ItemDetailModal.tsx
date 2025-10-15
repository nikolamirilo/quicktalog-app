"use client";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { ZoomIn } from "lucide-react";
import { useState } from "react";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Service } from "@/types";
import { OptimizedImage } from "../common/OptimizedImage";

interface ItemInfoModalProps {
	isOpen: boolean;
	onClose: () => void;
	item?: Service;
	currency: string;
	theme?: string;
	variant?: string;
}

export default function ItemDetailModal({
	isOpen,
	onClose,
	item,
	currency,
	theme,
	variant,
}: ItemInfoModalProps) {
	const [isImageZoomed, setIsImageZoomed] = useState(false);

	return (
		<>
			<Dialog onOpenChange={(open) => !open && onClose()} open={isOpen}>
				<DialogContent
					className={`text-card-text max-w-sm w-[90vw] sm:max-w-md sm:w-full p-0 bg-card-bg border border-card-border shadow-lg rounded-2xl overflow-hidden fixed left-[50%] top-[50%] translate-x-[-50%] translate-y-[-50%] max-h-[90vh] flex flex-col ${theme || ""}`}
				>
					{/* Image Section - Only show for variants that have images */}
					{item.image && variant !== "variant_3" && (
						<div className="relative w-full h-80 bg-card-bg/10 flex-shrink-0 overflow-hidden">
							<OptimizedImage
								alt={item.name}
								className="w-full h-full object-cover"
								priority
								src={item.image}
							/>
							{/* Gradient overlay for better text readability */}
							<div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
							{/* Zoom button */}
							<button
								aria-label="Zoom image"
								className="absolute bottom-2 right-2 p-2 bg-black/50 hover:bg-black/70 text-white rounded-full transition-colors duration-200 backdrop-blur-sm"
								onClick={() => setIsImageZoomed(true)}
								type="button"
							>
								<ZoomIn size={16} />
							</button>
						</div>
					)}

					{/* Content Section */}
					<div className="flex-1 overflow-y-auto">
						<div className="p-4 sm:p-6">
							<DialogHeader className="space-y-4 text-left mb-6">
								<DialogTitle className="text-xl sm:text-2xl font-bold text-card-heading font-heading leading-tight">
									{item.name}
								</DialogTitle>
								<DialogDescription className="text-card-description text-sm sm:text-base leading-relaxed">
									{item.description}
								</DialogDescription>
							</DialogHeader>

							{/* Price Section */}
							<div className="mt-6 pt-4 border-t border-card-border">
								<div className="flex items-center justify-center sm:justify-between flex-col sm:flex-row gap-2 sm:gap-0">
									<span className="text-xs sm:text-sm text-card-description uppercase tracking-wide font-medium">
										Price
									</span>
									<div className="flex items-center gap-1">
										<span className="text-xl sm:text-2xl font-bold text-price tabular-nums">
											{item.price.toLocaleString()} {currency}
										</span>
									</div>
								</div>
							</div>
						</div>
					</div>
				</DialogContent>
			</Dialog>

			{/* Full screen image modal */}
			<Dialog onOpenChange={setIsImageZoomed} open={isImageZoomed}>
				<DialogContent className="max-w-[95vw] max-h-[95vh] w-full h-[95vh] p-0 bg-black/90 border-none rounded-none">
					<VisuallyHidden>
						<DialogTitle>Full screen image view</DialogTitle>
					</VisuallyHidden>
					<div className="relative w-full h-full flex items-center justify-center border-none">
						{item?.image && (
							<OptimizedImage
								alt={item.name}
								className="w-full h-full object-cover"
								priority
								src={item.image}
							/>
						)}
					</div>
				</DialogContent>
			</Dialog>
		</>
	);
}
