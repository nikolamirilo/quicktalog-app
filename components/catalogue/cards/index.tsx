"use client";
import ItemDetailModal from "@/components/catalogue/modals/ItemDetailModal";
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
	blockIndex,
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
	blockIndex?: number;
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

	const { validatedRecord, formattedCurrency } = useMemo(() => {
		const hasPrice = record.price !== undefined && record.price !== null;
		const price = !hasPrice
			? ""
			: record.price == 0
				? "Free"
				: Number(record.price).toLocaleString(locale, {
						minimumFractionDigits: Number(record.price) % 1 === 0 ? 0 : 2,
						maximumFractionDigits: 2,
					});

		const formattedCurrency = hasPrice && price !== "Free" ? currency : "";

		const validatedRecord = {
			...record,
			order: i,
			price: price,
			image: record.image || DEFAULT_IMAGE,
		};

		return { validatedRecord, formattedCurrency };
	}, [record, currency, i, locale]);

	const CardComponent = CARD_VARIANTS[variant] || SideImageCard;

	return (
		<>
			<CardComponent
				blockIndex={blockIndex}
				currency={formattedCurrency}
				isFirst={isFirst}
				isLast={isLast}
				itemIndex={i}
				mode={mode === "edit" ? "edit" : "view"}
				onClick={() => setIsModalOpen(true)}
				onDelete={onDelete}
				onEdit={onEdit}
				onMoveDown={onMoveDown}
				onMoveUp={onMoveUp}
				record={validatedRecord}
			/>
			<ItemDetailModal
				currency={formattedCurrency}
				isOpen={isModalOpen}
				item={validatedRecord}
				onClose={() => setIsModalOpen(false)}
				theme={theme}
				variant={variant}
			/>
		</>
	);
};

export default CardsSwitcher;
