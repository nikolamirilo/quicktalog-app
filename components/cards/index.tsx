"use client";
import { useState } from "react";
import { Record } from "@/types";
import ItemDetailModal from "../modals/ItemDetailModal";
import CardType1 from "./CardType1";
import CardType2 from "./CardType2";
import CardType3 from "./CardType3";
import CardType4 from "./CardType4";

const CardsSwitcher = ({
	variant,
	record,
	currency,
	i,
	theme,
}: {
	variant: string;
	record: Record;
	currency: string;
	i: number;
	theme?: string;
}) => {
	// Validate record data
	if (!record || !record.name || record.price === undefined) {
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
	const price =
		record.price === 0
			? "Free"
			: record.price
				? record.price.toLocaleString()
				: "Free";
	const formatedCurrency = price != "Free" ? currency : "";

	const validatedRecord = {
		...record,
		price,
		image:
			record.image ||
			"https://vgrutvaw2q.ufs.sh/f/X7AUkOrs4vhbLZJd0wWMZP0cAtUu7EI5sD2VGw41vjTYyfKL",
	};

	// Helper function to pick card component
	const renderCard = () => {
		switch (variant) {
			case "variant_1":
				return (
					<CardType1
						currency={formatedCurrency}
						key={`c1-${validatedRecord.name}-${i}`}
						onClick={() => {
							setIsModalOpen(true);
						}}
						record={validatedRecord}
					/>
				);
			case "variant_2":
				return (
					<CardType2
						currency={formatedCurrency}
						key={`c2-${validatedRecord.name}-${i}`}
						onClick={() => {
							setIsModalOpen(true);
						}}
						record={validatedRecord}
					/>
				);
			case "variant_3":
				return (
					<CardType3
						currency={formatedCurrency}
						key={`c3-${validatedRecord.name}-${i}`}
						onClick={() => {
							setIsModalOpen(true);
						}}
						record={validatedRecord}
					/>
				);
			case "variant_4":
				return (
					<CardType4
						currency={formatedCurrency}
						key={`c4-${validatedRecord.name}-${i}`}
						onClick={() => {
							setIsModalOpen(true);
						}}
						record={validatedRecord}
					/>
				);
			default:
				return (
					<CardType1
						currency={formatedCurrency}
						key={`c1-${validatedRecord.name}-${i}`}
						onClick={() => {
							setIsModalOpen(true);
						}}
						record={validatedRecord}
					/>
				);
		}
	};

	return (
		<>
			{renderCard()}
			<ItemDetailModal
				currency={formatedCurrency}
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
