"use client";
import {
	CameraIcon,
	CheckCircle2,
	Image as ImageIcon,
	UploadCloud,
	X,
	XCircle,
} from "lucide-react";
import { useState } from "react";
import { BiScan } from "react-icons/bi";
import { createWorker, OEM } from "tesseract.js";
import { Button } from "@/components/ui/button";
import { OCRImageData } from "@/types";
import { Step1GeneralProps } from "@/types/components";
import { getLanguageParameters, preprocessImage } from "@/utils/ocr";

interface OCRImportProps {
	formData: Step1GeneralProps["formData"];
	extractedText: string;
	setExtractedText: (text: string) => void;
	isSubmitting: boolean;
	onExtractComplete: (text: string) => Promise<void>;
	checkValidity: () => boolean;
}

const OCRImport = ({
	formData,
	extractedText,
	setExtractedText,
	isSubmitting,
	onExtractComplete,
	checkValidity,
}: OCRImportProps) => {
	const [images, setImages] = useState<OCRImageData[]>([]);
	const [isProcessing, setIsProcessing] = useState(false);
	const [currentProcessingIndex, setCurrentProcessingIndex] =
		useState<number>(-1);

	const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		if (event.target.files) {
			const newFiles = Array.from(event.target.files);
			const newImages: OCRImageData[] = newFiles.map((file, index) => ({
				id: `${Date.now()}-${index}`,
				file,
				originalUrl: URL.createObjectURL(file),
				isProcessed: false,
			}));

			setImages((prev) => [...prev, ...newImages]);
			setExtractedText("");
		}
	};

	const removeImage = (imageId: string) => {
		setImages((prev) => {
			const imageToRemove = prev.find((img) => img.id === imageId);
			if (imageToRemove) {
				URL.revokeObjectURL(imageToRemove.originalUrl);
			}
			return prev.filter((img) => img.id !== imageId);
		});
		setExtractedText("");
	};

	const updateOCRImageData = (
		imageId: string,
		updates: Partial<OCRImageData>,
	) => {
		setImages((prev) =>
			prev.map((img) => (img.id === imageId ? { ...img, ...updates } : img)),
		);
	};

	const processImage = async (imageData: OCRImageData, index: number) => {
		setCurrentProcessingIndex(index);

		try {
			const preprocessedBlob = await preprocessImage(imageData.file);

			if (!preprocessedBlob) {
				console.error(`Image preprocessing failed for image ${index + 1}`);
				return null;
			}

			const imageToProcess = new File(
				[preprocessedBlob],
				"processed-image.png",
				{ type: "image/png" },
			);

			let languageToUse = formData.language;
			if (formData.language === "srp_latn") {
				languageToUse = "hrv";
			}

			const worker = await createWorker(languageToUse, OEM.LSTM_ONLY);
			const languageParams = getLanguageParameters(languageToUse);
			await worker.setParameters(languageParams);

			const {
				data: { text, confidence: ocrConfidence },
			} = await worker.recognize(imageToProcess);

			updateOCRImageData(imageData.id, {
				confidence: ocrConfidence,
				isProcessed: true,
			});

			await worker.terminate();
			return text;
		} catch (error) {
			console.error("Error during OCR recognition:", error);
			updateOCRImageData(imageData.id, {
				confidence: 0,
				isProcessed: true,
			});
			return null;
		}
	};

	const extractTextFromAllImages = async (): Promise<{
		text: string;
		success: boolean;
	}> => {
		if (images.length === 0) return { text: "", success: false };

		setIsProcessing(true);
		setExtractedText("");
		const extractedTexts: string[] = [];
		const lowQualityImages: number[] = [];

		for (let i = 0; i < images.length; i++) {
			const imageData = images[i];
			const text = await processImage(imageData, i);

			if (imageData.confidence !== undefined && imageData.confidence < 60) {
				lowQualityImages.push(i + 1);
				continue;
			}

			if (text && text.trim()) {
				extractedTexts.push(`--- Image ${i + 1} ---\n${text.trim()}`);
			} else {
				extractedTexts.push(`--- Image ${i + 1} ---\n[No text detected]`);
			}
		}

		setCurrentProcessingIndex(-1);
		setIsProcessing(false);

		const combinedText = extractedTexts.join("\n\n");
		setExtractedText(combinedText);
		let success = true;

		if (lowQualityImages.length > 0) {
			const imageList = lowQualityImages.join(", ");
			success = false;
			alert(
				`⚠️ Image(s) ${imageList} ${lowQualityImages.length === 1 ? "has" : "have"} poor quality (confidence < 60%) and ${lowQualityImages.length === 1 ? "was" : "were"} excluded. Please upload better quality image(s) for accurate text extraction.`,
			);
		}

		return { text: combinedText, success: success };
	};

	const handleStartImport = async (e: React.MouseEvent<HTMLButtonElement>) => {
		e.preventDefault();
		if (!checkValidity()) {
			return;
		}
		if (images.length === 0) {
			alert("Please select at least one image to process.");
			return;
		}

		try {
			const { text, success } = await extractTextFromAllImages();

			if (!text || !text.trim()) {
				alert("No text was extracted from images. Please try again.");
				return;
			}

			if (success === false) {
				alert(
					"Confidence level must be above 60%. Please remove low quality images and upload higher quality images to get best results.",
				);
				return;
			}
			if (success === true) {
				await onExtractComplete(text);
			}
		} catch (error) {
			console.error("Error during extraction:", error);
			alert("An error occurred during processing.");
		}
	};

	const allImagesProcessed =
		images.length > 0 && images.every((img) => img.isProcessed);
	const hasExtractedText = extractedText.trim().length > 0;

	return (
		<div className="flex flex-col items-center text-product-foreground h-fit">
			<div className="flex flex-col sm:flex-row gap-4 items-center w-full max-w-lg">
				<label
					className="w-full sm:w-auto px-4 py-2 rounded-lg bg-product-primary text-product-secondary font-semibold text-center cursor-pointer
                          transition-all duration-300 ease-in-out flex flex-row items-center justify-center gap-2"
				>
					<UploadCloud />
					Upload from Gallery
					<input
						accept="image/*"
						className="hidden"
						disabled={isProcessing || isSubmitting}
						multiple
						onChange={handleImageChange}
						type="file"
					/>
				</label>

				<label
					className="w-full sm:w-auto px-4 py-2 rounded-lg bg-product-secondary text-product-primary font-semibold text-center cursor-pointer
                          transition-all duration-300 ease-in-out flex flex-row gap-2 items-center justify-center"
				>
					<CameraIcon /> Open Camera App
					<input
						accept="image/*"
						capture="environment"
						className="hidden"
						disabled={isProcessing || isSubmitting}
						onChange={handleImageChange}
						type="file"
					/>
				</label>
			</div>
			<div className="w-full text-base my-4 sm:my-6">
				<span className="text-product-primary font-bold">Hint: </span>
				<span className="text-product-foreground-accent">
					For <b>best results</b>, use <b>high-resolution</b> images in{" "}
					<b>JPEG</b> or <b>PNG</b> format, ensuring the menu or file is{" "}
					<b>clearly visible</b> and <b>unobstructed</b>.
				</span>
			</div>
			{/* Images Grid */}
			{images.length > 0 && (
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
								<div className="p-2 rounded-2xl border-2 border-product-border bg-hero-product-background shadow-product hover:shadow-xl transition-all duration-300 hover:scale-105">
									{/* Remove button */}
									<button
										className="absolute top-1 right-1 z-10 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-all shadow-lg hover:shadow-xl hover:scale-110"
										disabled={isProcessing || isSubmitting}
										onClick={() => removeImage(imageData.id)}
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
			)}
			<div className="mb-8 w-full">
				<Button
					className="w-full text-lg py-6"
					disabled={images.length === 0 || isProcessing || isSubmitting}
					onClick={handleStartImport}
					type="button"
					variant="cta"
				>
					{isProcessing ? (
						<>
							<div className="animate-spin rounded-full h-5 w-5 border-b-2 border-black ml-2"></div>
							Processing Images...
						</>
					) : isSubmitting ? (
						<>
							<div className="animate-spin rounded-full h-5 w-5 border-b-2 border-black ml-2"></div>
							Submitting...
						</>
					) : (
						<>
							<BiScan className="mr-2" color="black" size={28} /> Start
							Importing
						</>
					)}
				</Button>
			</div>
			{/* Processing Summary */}
			<div className="flex flex-col gap-6 w-full mb-8">
				<div className="p-8 rounded-2xl border-2 border-product-border bg-gradient-to-br from-hero-product-background to-product-background shadow-xl">
					<div className="flex items-center gap-3 mb-6">
						<div className="p-2 bg-product-primary rounded-lg">
							<BiScan color="black" size={24} />
						</div>
						<h3 className="font-bold text-2xl text-product-foreground">
							Processing Summary
						</h3>
					</div>
					<div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
						<div className="bg-product-background/50 p-4 rounded-xl border border-product-border">
							<p className="text-sm text-product-foreground-accent mb-1">
								Images Selected
							</p>
							<p className="text-3xl font-bold text-product-primary">
								{images.length}
							</p>
						</div>
						<div className="bg-product-background/50 p-4 rounded-xl border border-product-border">
							<p className="text-sm text-product-foreground-accent mb-1">
								Images Processed
							</p>
							<p className="text-3xl font-bold text-product-secondary">
								{images.filter((img) => img.isProcessed).length}
							</p>
						</div>
						<div className="bg-product-background/50 p-4 rounded-xl border border-product-border">
							<p className="text-sm text-product-foreground-accent mb-1">
								Text Extracted
							</p>
							<div className="flex items-center gap-2">
								{hasExtractedText ? (
									<>
										<CheckCircle2 className="text-green-600" size={24} />
										<p className="text-2xl font-bold text-green-600">Yes</p>
									</>
								) : (
									<>
										<XCircle className="text-gray-400" size={24} />
										<p className="text-2xl font-bold text-gray-400">No</p>
									</>
								)}
							</div>
						</div>
					</div>

					{allImagesProcessed && !hasExtractedText && (
						<div className="mt-6 p-4 bg-yellow-50 border-2 border-yellow-200 rounded-xl">
							<p className="text-yellow-800 font-medium text-center">
								⚠️ No text was extracted from the images. Please try different
								images.
							</p>
						</div>
					)}
				</div>
			</div>
		</div>
	);
};

export default OCRImport;
