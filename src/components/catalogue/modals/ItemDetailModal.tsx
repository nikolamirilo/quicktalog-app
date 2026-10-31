"use client";
import { hasItemPhoto } from "@/lib/catalogue/item-image";
import { type Item } from "@quicktalog/common";
import { Maximize2, X } from "lucide-react";
import { useState } from "react";
import {
	CatalogueDialog,
	CatalogueDialogClose,
	CatalogueDialogDescription,
	CatalogueDialogTitle,
	CatalogueSheetContent,
} from "@/components/catalogue/modals/CatalogueDialog";
import { ItemPhotoViewer } from "@/components/catalogue/modals/ItemPhotoViewer";
import { OptimizedImage } from "@/components/general/OptimizedImage";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { useSwipeToClose } from "@/hooks/useSwipeToClose";
import type { ItemPrice } from "@/lib/catalogue/item-price";
import { cn } from "@/lib/ui/cn";

interface ItemDetailModalProps {
	isOpen: boolean;
	onClose: () => void;
	item: Pick<Item, "name" | "description" | "image">;
	price: ItemPrice | null;
	sectionName?: string;
	theme?: string;
}

/** Below the `md` breakpoint (720px) the modal is a bottom sheet. */
const SHEET_QUERY = "(max-width: 719.98px)";

const softFillClass =
	"bg-[color-mix(in_srgb,var(--catalogue-card-heading)_7%,transparent)]";
const focusRingClass =
	"focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current";
const photoButtonClass =
	"absolute z-20 flex size-10 items-center justify-center rounded-[var(--catalogue-pill-radius)] bg-white/90 text-[#16140f] shadow-[0_2px_10px_rgba(0,0,0,0.18)] backdrop-blur transition-colors hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white";

export function ItemDetailModal({
	isOpen,
	onClose,
	item,
	price,
	sectionName,
	theme,
}: ItemDetailModalProps) {
	const [isPhotoOpen, setIsPhotoOpen] = useState(false);
	const isSheet = useMediaQuery(SHEET_QUERY);
	const swipe = useSwipeToClose({ open: isOpen, onClose, enabled: isSheet });

	const photo = hasItemPhoto(item.image) ? item.image : undefined;
	const hasTopRow = Boolean(sectionName) || !photo;

	return (
		<>
			<CatalogueDialog
				onOpenChange={(open) => !open && onClose()}
				open={isOpen}
			>
				<CatalogueSheetContent
					className={theme}
					style={swipe.style}
					{...(item.description ? {} : { "aria-describedby": undefined })}
				>
					{photo ? (
						<div
							className="relative h-[clamp(200px,34dvh,280px)] shrink-0 overflow-hidden max-md:touch-none md:h-[325px]"
							{...swipe.handleProps}
						>
							<OptimizedImage
								alt={item.name}
								className="object-cover"
								priority
								src={photo}
							/>
							<div
								aria-hidden="true"
								className="pointer-events-none absolute inset-x-0 top-0 z-10 h-20 bg-gradient-to-b from-black/30 to-transparent md:hidden"
							/>
							<SheetHandle className="absolute left-1/2 top-2 z-10 -translate-x-1/2 bg-white/90" />
							<CatalogueDialogClose
								aria-label="Close"
								className={cn(photoButtonClass, "right-3 top-4 md:right-4")}
							>
								<X aria-hidden="true" className="size-5" />
							</CatalogueDialogClose>
							<button
								aria-label="Enlarge photo"
								className={cn(
									photoButtonClass,
									"bottom-3 right-3 md:bottom-4 md:right-4",
								)}
								onClick={() => setIsPhotoOpen(true)}
								type="button"
							>
								<Maximize2 aria-hidden="true" className="size-[18px]" />
							</button>
						</div>
					) : (
						<div
							className="flex shrink-0 justify-center pt-2 max-md:touch-none md:hidden"
							{...swipe.handleProps}
						>
							<SheetHandle className="bg-[color-mix(in_srgb,var(--catalogue-card-heading)_22%,transparent)]" />
						</div>
					)}

					<div
						className={cn(
							"min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-6 md:px-7 md:pb-7 md:pt-6",
							photo ? "pt-5" : "pt-3",
						)}
					>
						{hasTopRow && (
							<div className="flex items-center justify-between gap-3">
								{sectionName && (
									<span
										className={cn(
											"inline-flex h-[30px] min-w-0 items-center truncate rounded-[var(--catalogue-pill-radius)] px-3 text-[13px] font-semibold text-catalogue-card-heading",
											softFillClass,
										)}
									>
										{sectionName}
									</span>
								)}
								{!photo && (
									<CatalogueDialogClose
										aria-label="Close"
										className={cn(
											"ml-auto flex size-10 shrink-0 items-center justify-center rounded-[var(--catalogue-pill-radius)] text-catalogue-card-heading",
											softFillClass,
											focusRingClass,
										)}
									>
										<X aria-hidden="true" className="size-5" />
									</CatalogueDialogClose>
								)}
							</div>
						)}
						<CatalogueDialogTitle
							className={cn(
								"font-heading text-[26px] font-bold leading-[1.2] tracking-[-0.01em] text-catalogue-card-heading md:text-[30px]",
								hasTopRow && "mt-3.5 md:mt-4",
							)}
						>
							{item.name}
						</CatalogueDialogTitle>
						{item.description && (
							<CatalogueDialogDescription className="mt-2.5 whitespace-pre-line text-base leading-relaxed text-catalogue-card-description md:mt-3 md:text-[16.5px]">
								{item.description}
							</CatalogueDialogDescription>
						)}
					</div>

					<div className="flex shrink-0 items-center justify-between gap-4 border-t border-[color-mix(in_srgb,var(--catalogue-card-heading)_12%,transparent)] px-5 pb-[calc(1.5rem+env(safe-area-inset-bottom))] pt-3.5 md:px-7 md:pb-5 md:pt-4">
						{price && <ItemPriceSummary price={price} />}
						<CatalogueDialogClose
							className={cn(
								"h-12 shrink-0 rounded-[var(--catalogue-pill-radius)] border-[1.5px] border-[color-mix(in_srgb,var(--catalogue-card-heading)_22%,transparent)] px-6 text-[15px] font-semibold text-catalogue-card-heading transition-colors hover:bg-[color-mix(in_srgb,var(--catalogue-card-heading)_7%,transparent)] md:h-11",
								focusRingClass,
								!price && "flex-1",
							)}
						>
							Close
						</CatalogueDialogClose>
					</div>
				</CatalogueSheetContent>
			</CatalogueDialog>

			{photo && (
				<ItemPhotoViewer
					alt={item.name}
					onOpenChange={setIsPhotoOpen}
					open={isPhotoOpen}
					src={photo}
				/>
			)}
		</>
	);
}

function SheetHandle({ className }: { className: string }) {
	return (
		<span
			aria-hidden="true"
			className={cn("block h-[5px] w-9 rounded-full md:hidden", className)}
		/>
	);
}

function ItemPriceSummary({ price }: { price: ItemPrice }) {
	const amount = [price.amount, price.currency].filter(Boolean).join(" ");

	return (
		<div className="flex min-w-0 flex-col gap-0.5">
			{price.original && (
				<div className="flex items-center gap-2">
					<span className="text-sm text-catalogue-card-description line-through">
						<span className="sr-only">Was </span>
						{price.original} {price.currency}
					</span>
					{price.percentOff ? (
						<span className="inline-flex h-[22px] items-center rounded-[var(--catalogue-pill-radius)] bg-[#d92d20] px-2 text-xs font-bold text-white">
							−{price.percentOff}%
						</span>
					) : null}
				</div>
			)}
			<p className="flex flex-wrap items-baseline gap-x-1.5">
				<span className="font-heading text-2xl font-bold tabular-nums text-price md:text-[26px]">
					{amount}
				</span>
				{price.unit && (
					<span className="text-[15px] text-catalogue-card-description">
						/ {price.unit}
					</span>
				)}
			</p>
		</div>
	);
}
