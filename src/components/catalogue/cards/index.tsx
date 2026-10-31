"use client";
import { ItemDetailModal } from "@/components/catalogue/modals/ItemDetailModal";
import { hasItemPhoto } from "@/lib/catalogue/item-image";
import { formatItemAmount, getItemPrice } from "@/lib/catalogue/item-price";
import { DEFAULT_IMAGE, Item } from "@quicktalog/common";
import { useMemo, useState } from "react";
import CarouselCard from "./CarouselCard";
import SideImageCard from "./SideImageCard";
import TextOnlyCard from "./TextOnlyCard";
import TopImageCard from "./TopImageCard";

const CARD_VARIANTS: Record<string, React.ElementType> = {
	variant_1: SideImageCard,
	variant_2: TopImageCard,
	variant_3: TextOnlyCard,
	variant_4: CarouselCard,
};

const CardsSwitcher = ({
	variant,
	record,
	currency,
	locale = "en-US",
	i,
	theme,
	mode,
	onDelete,
	onEdit,
	onMoveUp,
	onMoveDown,
	isFirst,
	isLast,
	blockId,
	sectionName,
}: {
	variant: string;
	record: Item;
	currency: string;
	locale?: string;
	i: number;
	theme?: string;
	mode?: string;
	onDelete?: () => void;
	onEdit?: () => void;
	onMoveUp?: () => void;
	onMoveDown?: () => void;
	isFirst?: boolean;
	isLast?: boolean;
	blockId?: string;
	sectionName?: string;
}) => {
	// A missing price is a valid item (a service list, an "ask us" menu); only a
	// nameless record is unrenderable.
	if (!record || !record.name) {
		console.error("CardsSwitcher: Invalid record data:", record);
		return (
			<div
				aria-live="polite"
				className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded"
				role="alert"
			>
				<p>Invalid item data</p>
			</div>
		);
	}

	const [isModalOpen, setIsModalOpen] = useState(false);

	const { validatedRecord, formattedCurrency, detailPrice } = useMemo(() => {
		const hasPrice = record.price !== undefined && record.price !== null;
		const price = !hasPrice
			? ""
			: record.price == 0
				? "Free"
				: formatItemAmount(Number(record.price), locale);

		const formattedCurrency = hasPrice && price !== "Free" ? currency : "";

		const validatedRecord = {
			...record,
			order: i,
			price: price,
			image: hasItemPhoto(record.image) ? record.image : DEFAULT_IMAGE,
		};

		return {
			validatedRecord,
			formattedCurrency,
			detailPrice: getItemPrice(record, currency, locale),
		};
	}, [record, currency, i, locale]);

	const CardComponent = CARD_VARIANTS[variant] || SideImageCard;

	return (
		<>
			<CardComponent
				blockId={blockId}
				currency={formattedCurrency}
				isFirst={isFirst}
				isLast={isLast}
				mode={mode === "edit" ? "edit" : "view"}
				onClick={() => setIsModalOpen(true)}
				onDelete={onDelete}
				onEdit={onEdit}
				onMoveDown={onMoveDown}
				onMoveUp={onMoveUp}
				record={validatedRecord}
			/>
			<ItemDetailModal
				isOpen={isModalOpen}
				item={record}
				onClose={() => setIsModalOpen(false)}
				price={detailPrice}
				sectionName={sectionName}
				theme={theme}
			/>
		</>
	);
};

export default CardsSwitcher;
