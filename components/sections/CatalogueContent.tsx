"use client";
import { AnimatePresence, motion } from "framer-motion";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useMainContext } from "@/context/MainContext";
import {
	contentVariants,
	getCurrencySymbol,
	getGridStyle,
} from "@/helpers/client";
import { CatalogueContentProps } from "@/types/components";
import "swiper/css";
import "swiper/css/pagination";
import { generateUniqueSlug } from "@quicktalog/common";
import { Swiper, SwiperSlide } from "swiper/react";
import CardsSwitcher from "../cards";
import SectionHeader from "./SectionHeader";

const CatalogueContent = ({
	data,
	currency,
	type,
	theme,
}: CatalogueContentProps) => {
	const { layout } = useMainContext();
	const [expandedSections, setExpandedSections] = useState<
		Record<string, boolean>
	>({});
	const searchParams = useSearchParams();

	useEffect(() => {
		if (!data || data.length === 0) return;
		const initialExpanded = data.reduce(
			(acc, item, idx) => {
				const slug = generateUniqueSlug(item.name);
				acc[`${slug}-${item.order}`] = type === "demo" || idx === 0;
				return acc;
			},
			{} as Record<string, boolean>,
		);
		setExpandedSections(initialExpanded);
	}, [data, type]);

	const handleToggleSection = (slug: string) => {
		setExpandedSections((prev) => ({
			...prev,
			[slug]: !prev[slug],
		}));
	};
	useEffect(() => {
		const isExpanded = searchParams.get("expanded");
		console.log("isExpanded from URL:", isExpanded);

		if (isExpanded && data && data.length > 0) {
			// Create an object where all sections are expanded
			const allSectionsExpanded = data.reduce(
				(acc, item) => {
					const slug = generateUniqueSlug(item.name);
					acc[slug] = true;
					return acc;
				},
				{} as Record<string, boolean>,
			);

			setExpandedSections(allSectionsExpanded);
		}
	}, [searchParams, data]);

	if (!data || !Array.isArray(data)) {
		console.warn("No data, rendering null");
		return (
			<main
				aria-label="Services content"
				className="max-w-6xl mx-auto px-4 py-4"
			>
				<div
					aria-live="polite"
					className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center"
					role="alert"
				>
					<h2 className="text-lg font-semibold text-yellow-800 mb-2">
						No Services Available
					</h2>
					<p className="text-yellow-700">
						No service data has been loaded yet.
					</p>
				</div>
			</main>
		);
	}

	if (data.length === 0) {
		return (
			<main
				aria-label="Services content"
				className="max-w-6xl mx-auto px-4 py-4"
			>
				<div
					aria-live="polite"
					className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center"
					role="alert"
				>
					<h2 className="text-lg font-semibold text-yellow-800 mb-2">
						No Categories
					</h2>
					<p className="text-yellow-700">
						No service categories were found in the data.
					</p>
				</div>
			</main>
		);
	}

	return (
		<main
			aria-label="Categories and items"
			className="max-w-6xl mx-auto py-5 px-4"
		>
			{data.map((item) => {
				const currentLayout = type === "demo" ? layout : item.layout;
				const slug = generateUniqueSlug(item.name);
				const isExpanded = expandedSections[`${slug}-${item.order}`];

				if (!item.items || !Array.isArray(item.items)) {
					return (
						<section
							className="mb-5"
							id={`${slug}-${item.order}`}
							key={`${slug}-${item.order}`}
						>
							<SectionHeader
								code={`${slug}-${item.order}`}
								isExpanded={isExpanded}
								onToggle={handleToggleSection}
								title={item.name}
							/>
							<div
								aria-live="polite"
								className="bg-red-50 border border-red-200 rounded-lg p-4 mt-4"
								role="alert"
							>
								<p className="text-red-700 text-sm">
									Invalid data for this section
								</p>
							</div>
						</section>
					);
				}

				return (
					<section
						className="mb-5"
						id={`${slug}-${item.order}`}
						key={`${slug}-${item.order}`}
					>
						<SectionHeader
							code={`${slug}-${item.order}`}
							isExpanded={isExpanded}
							onToggle={handleToggleSection}
							title={item.name}
						/>

						<AnimatePresence initial={false}>
							{isExpanded && (
								<motion.div
									animate="visible"
									aria-label={`${item.name} items`}
									className="overflow-hidden"
									exit="hidden"
									initial="hidden"
									key="content"
									role="region"
									transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
									variants={contentVariants}
								>
									{currentLayout === "variant_4" ? (
										<Swiper
											aria-label={`${item.name} carousel`}
											className="mt-4 px-0 sm:px-2 py-2"
											role="region"
											slidesPerView="auto"
											spaceBetween={12}
										>
											{item.items.map((record, i) => (
												<SwiperSlide
													aria-label={`Item ${i + 1} of ${item.items.length}`}
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
													/>
												</SwiperSlide>
											))}
										</Swiper>
									) : (
										<div className={getGridStyle(currentLayout)}>
											{item.items.map((record, i) => (
												<CardsSwitcher
													currency={getCurrencySymbol(currency)}
													i={i}
													key={record.name}
													record={record}
													theme={theme}
													variant={currentLayout}
												/>
											))}
										</div>
									)}
								</motion.div>
							)}
						</AnimatePresence>
					</section>
				);
			})}
		</main>
	);
};

export default CatalogueContent;
