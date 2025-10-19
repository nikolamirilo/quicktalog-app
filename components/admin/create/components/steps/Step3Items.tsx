"use client";
import { ChevronDown, Plus, Trash2 } from "lucide-react";
import React, { useEffect } from "react";
import { FaPen } from "react-icons/fa6";
import { FiInfo } from "react-icons/fi";
import { MdOutlineLocalOffer } from "react-icons/md";
import ImageDropzone from "@/components/common/ImageDropzone";
import InformModal from "@/components/modals/InformModal";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { getCurrencySymbol } from "@/helpers/client";
import type { Step3ItemsProps } from "@/types/components";

const Step3Items: React.FC<Step3ItemsProps> = ({
	formData,
	handleAddItem,
	handleRemoveItem,
	handleItemChange,
	imagePreviews,
	setImagePreviews,
	isUploading,
	setIsUploading,
	expandedCategory,
	setExpandedCategory,
	expandedItem,
	setExpandedItem,
	setShowLimitsModal,
	tier,
}) => {
	const [editableCategoryIndex, setEditableCategoryIndex] = React.useState<
		number | null
	>(null);
	const [isInfoModalOpen, setIsInfoModalOpen] = React.useState(false);
	const toggleCategory = (index: number) => {
		setExpandedCategory(expandedCategory === index ? null : index);
		setExpandedItem(null);
	};

	const toggleItem = (categoryIndex: number, itemIndex: number) => {
		const currentExpanded = expandedItem;
		if (
			currentExpanded?.categoryIndex === categoryIndex &&
			currentExpanded?.itemIndex === itemIndex
		) {
			setExpandedItem(null);
		} else {
			setExpandedItem({ categoryIndex, itemIndex });
		}
	};

	useEffect(() => {
		setExpandedItem({ categoryIndex: 0, itemIndex: 0 });
	}, []);

	const toggleEditable = (displayIndex: number) => {
		setEditableCategoryIndex(
			editableCategoryIndex === displayIndex ? null : displayIndex,
		);
	};

	return (
		<Card
			className="space-y-8 p-4 sm:p-4 bg-product-background/95 border-0 border-product-border shadow-product-shadow rounded-2xl"
			type="form"
		>
			<div className="flex items-center gap-3">
				<h2 className="text-2xl sm:text-3xl font-bold text-product-foreground flex items-center gap-3 font-heading">
					<MdOutlineLocalOffer className="text-product-primary" size={32} />
					Add Items
				</h2>
				<button
					className="hover:text-product-primary transition-colors duration-200 z-10"
					onClick={() => setIsInfoModalOpen(true)}
					type="button"
				>
					<FiInfo size={20} />
				</button>
			</div>
			{formData.services.length === 0 ? (
				<div className="text-center p-8 bg-product-background/50 bg-product-background rounded-xl border border-product-border">
					<p className="text-product-foreground-accent text-lg font-body">
						Please add categories in Step 2 first.
					</p>
				</div>
			) : (
				formData.services.map((category, categoryIndex) => (
					<Card
						className="shadow-product-shadow bg-product-background/50 bg-product-background border border-product-border rounded-xl"
						key={`${category.name}-${categoryIndex}`}
						type="form"
					>
						<div
							className="flex justify-between items-center p-4 sm:p-6 cursor-pointer"
							onClick={() => toggleCategory(categoryIndex)}
						>
							<h3 className="text-xl font-bold text-product-foreground">
								{category.name || "N/A"}
							</h3>
							<ChevronDown
								className={`h-6 w-6 text-product-foreground-accent transition-transform duration-300 ${
									expandedCategory === categoryIndex ? "rotate-180" : ""
								}`}
							/>
						</div>

						{expandedCategory === categoryIndex && (
							<div className="p-2 sm:p-6 pt-0 space-y-6">
								{category.items.map((item, itemIndex) => {
									const isExpanded =
										expandedItem?.categoryIndex === categoryIndex &&
										expandedItem?.itemIndex === itemIndex;
									const isEditable = editableCategoryIndex === itemIndex;
									return (
										<Card
											className="border border-product-border shadow-product-shadow bg-product-background rounded-xl"
											key={`${categoryIndex}-${itemIndex}`}
										>
											<div
												className="flex justify-between items-center p-2 sm:p-4 cursor-pointer"
												onClick={() => toggleItem(categoryIndex, itemIndex)}
											>
												<div
													className="relative flex-1 max-w-[200px] xl:max-w-[250px] 2xl:max-w-[300px]"
													onClick={(e) => e.stopPropagation()}
												>
													<Input
														className={`w-full !text-lg font-medium px-3 py-2 pr-10 rounded-lg border-2 transition-all ${
															isEditable
																? "border-product-primary bg-white focus:ring-2 focus:ring-product-primary/20 focus:none outline-none"
																: "border-transparent bg-transparent cursor-pointer pointer-events-auto"
														}`}
														onChange={(e) =>
															handleItemChange(
																categoryIndex,
																itemIndex,
																"name",
																e.target.value,
															)
														}
														onClick={() =>
															!isEditable && toggleEditable(itemIndex)
														}
														placeholder={`Item ${itemIndex + 1}`}
														readOnly={!isEditable}
														required
														type="text"
														value={item.name}
													/>
													<button
														aria-label="Edit category name"
														className={`absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-md transition-colors ${
															isEditable
																? "text-product-primary hover:bg-product-primary/10"
																: "text-gray-400 hover:text-product-primary hover:bg-gray-100"
														}`}
														onClick={() => toggleEditable(itemIndex)}
														type="button"
													>
														<FaPen size={14} />
													</button>
												</div>
												<div className="flex items-center gap-4">
													<Button
														className="h-10 w-10 hover:bg-red-600 hover:shadow-product-hover-shadow"
														onClick={(e) => {
															e.stopPropagation();
															handleRemoveItem(categoryIndex, itemIndex);
														}}
														size="sm"
														type="button"
														variant="destructive"
													>
														<Trash2 className="h-4 w-4" />
													</Button>
													<ChevronDown
														className={`h-6 w-6 text-product-foreground-accent transition-transform duration-300 ${
															isExpanded ? "rotate-180" : ""
														}`}
													/>
												</div>
											</div>
											{isExpanded && (
												<>
													<div className="p-2 sm:p-6 pt-0 grid grid-cols-1 md:grid-cols-2 gap-6">
														<div className="space-y-3">
															<Label
																className="text-product-foreground font-medium font-body"
																htmlFor={`item-price-${categoryIndex}-${itemIndex}`}
															>
																Item Price (
																{getCurrencySymbol(formData.currency)})
																<span className="text-red-500 ml-1">*</span>
															</Label>
															<Input
																className="border-product-border focus:border-product-primary focus:ring-product-primary/20"
																id={`item-price-${categoryIndex}-${itemIndex}`}
																onChange={(e) =>
																	handleItemChange(
																		categoryIndex,
																		itemIndex,
																		"price",
																		parseFloat(e.target.value) || 0,
																	)
																}
																required
																step="0.01"
																type="number"
																value={item.price || ""}
															/>
														</div>
													</div>
													<div className="p-6 pt-0 grid grid-cols-1 lg:grid-cols-2 gap-6">
														<div className="space-y-3">
															<Label
																className="text-product-foreground font-medium font-body"
																htmlFor={`item-description-${categoryIndex}-${itemIndex}`}
															>
																Item Description
															</Label>
															<Textarea
																className="border-product-border focus:border-product-primary focus:ring-product-primary/20"
																id={`item-description-${categoryIndex}-${itemIndex}`}
																onChange={(e) =>
																	handleItemChange(
																		categoryIndex,
																		itemIndex,
																		"description",
																		e.target.value,
																	)
																}
																placeholder="Describe the dish, ingredients, etc."
																rows={8}
																value={item.description}
															/>
														</div>
														{category.layout !== "variant_3" && (
															<div className="space-y-3">
																<Label
																	className="text-product-foreground font-medium font-body"
																	htmlFor={`item-image-${categoryIndex}-${itemIndex}`}
																>
																	Image
																	<span className="text-red-500 ml-1">*</span>
																</Label>

																<ImageDropzone
																	image={
																		imagePreviews[
																			`${categoryIndex}-${itemIndex}`
																		] || item.image
																	}
																	onError={(error) => {
																		alert(`ERROR! ${error.message}`);
																		setIsUploading(false);
																	}}
																	onUploadComplete={(url) => {
																		handleItemChange(
																			categoryIndex,
																			itemIndex,
																			"image",
																			url,
																		);
																		setImagePreviews((prev) => ({
																			...prev,
																			[`${categoryIndex}-${itemIndex}`]: url,
																		}));
																		setIsUploading(false);
																	}}
																	removeImage={() => {
																		setImagePreviews((prev) => {
																			const newPreviews = { ...prev };
																			delete newPreviews[
																				`${categoryIndex}-${itemIndex}`
																			];
																			return newPreviews;
																		});
																		handleItemChange(
																			categoryIndex,
																			itemIndex,
																			"image",
																			"",
																		);
																	}}
																	setIsUploading={setIsUploading}
																/>
															</div>
														)}
													</div>
												</>
											)}
										</Card>
									);
								})}

								<Button
									className="px-6 py-3 text-base text-wrap font-medium bg-product-primary hover:bg-product-primary-accent hover:shadow-product-hover-shadow hover:scale-[1.02] hover:transform hover:-translate-y-1 transition-all duration-300"
									disabled={isUploading}
									onClick={() => {
										const totalItems = formData.services.reduce(
											(sum, category) => {
												return sum + category.items.length;
											},
											0,
										);
										if (
											typeof tier.features.items_per_catalogue == "number" &&
											totalItems >= tier.features.items_per_catalogue
										) {
											setShowLimitsModal({ isOpen: true, type: "items" });
										} else {
											handleAddItem(categoryIndex);
										}
									}}
									type="button"
								>
									<Plus className="h-5 w-5" /> New Item
								</Button>
							</div>
						)}
					</Card>
				))
			)}
			<InformModal
				cancelText=""
				confirmText="Got it!"
				isOpen={isInfoModalOpen}
				message="This step is where you add the actual services or products to your categories. For each item, you can set the name, price, description, and upload an image. Items are organized under the categories you created in Step 2. You can expand each category to add multiple items, and each item can have detailed descriptions and pricing information."
				onCancel={() => setIsInfoModalOpen(false)}
				onConfirm={() => setIsInfoModalOpen(false)}
				title="Add Items Explained"
			/>
		</Card>
	);
};

export default Step3Items;
