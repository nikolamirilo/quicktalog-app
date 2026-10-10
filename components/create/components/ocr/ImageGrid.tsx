"use client";
import { OCRImageData } from "@quicktalog/common";
import { CheckCircle2, Image as ImageIcon, X, XCircle } from "lucide-react";

interface ImageGridProps {
	images: OCRImageData[];
	currentProcessingIndex: number;
	isProcessing: boolean;
	isSubmitting: boolean;
	onRemoveImage: (imageId: string) => void;
}

const ImageGrid = ({
	images,
	currentProcessingIndex,
	isProcessing,
	isSubmitting,
	onRemoveImage,
}: ImageGridProps) => {
	if (images.length === 0) return null;

	return (
		<div className="w-full max-w-6xl mb-8">
			<div className="flex justify-between items-center mb-6">
				<div className="flex items-center gap-2">
					<ImageIcon className="text-product-primary" size={24} />
					<h2 className="text-2xl font-bold text-product-foreground">
						Selected Images
					</h2>
				</div>
			</div>

			<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
				{images.map((imageData, index) => (
					<div className="relative group" key={imageData.id}>
						<div className="p-2 rounded-2xl border-2 border-product-border bg-product-background-hero shadow-product hover:shadow-xl transition-all duration-300 hover:scale-105">
							{/* Remove button */}
							<button
								className="absolute top-1 right-1 z-10 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-all shadow-lg hover:shadow-xl hover:scale-110"
								disabled={isProcessing || isSubmitting}
								onClick={() => onRemoveImage(imageData.id)}
								type="button"
							>
								<X size={14} />
							</button>

							{/* Processing indicator */}
							{currentProcessingIndex === index && (
								<div className="absolute -top-2 left-1/2 -translate-x-1/2 z-10 px-3 py-1.5 bg-product-secondary text-white text-xs font-semibold rounded-full shadow-lg animate-pulse">
									Processing...
								</div>
							)}

							<div className="text-center">
								<div className="flex items-center justify-center gap-2 mb-3">
									<div className="w-2 h-2 rounded-full bg-product-primary"></div>
									<p className="text-sm font-bold text-product-foreground">
										Image {index + 1}
									</p>
								</div>

								<div className="relative overflow-hidden rounded-xl mb-3">
									<img
										alt={`Content ${index + 1}`}
										className="w-full h-24 object-cover transition-transform duration-300 group-hover:scale-110"
										src={imageData.originalUrl}
									/>
								</div>

								{/* Confidence badge */}
								{imageData.isProcessed && (
									<div className="flex justify-center">
										{imageData.confidence !== undefined &&
										imageData.confidence > 0 ? (
											<div
												className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full ${
													imageData.confidence > 80
														? "bg-green-100 text-green-800 border border-green-300"
														: imageData.confidence > 60
															? "bg-yellow-100 text-yellow-800 border border-yellow-300"
															: "bg-red-100 text-red-800 border border-red-300"
												}`}
											>
												<CheckCircle2 size={14} />
												{imageData.confidence.toFixed(1)}%
											</div>
										) : (
											<div className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full bg-gray-100 text-gray-800 border border-gray-300">
												<XCircle size={14} />
												Failed
											</div>
										)}
									</div>
								)}
							</div>
						</div>
					</div>
				))}
			</div>
		</div>
	);
};

export default ImageGrid;
