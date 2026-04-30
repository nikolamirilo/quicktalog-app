"use client";
import * as Sentry from "@sentry/nextjs";
import { Button } from "@/components/ui/button";
import { GeneralInformationInputProps } from "@/types/shared";
import { getLanguageParameters, preprocessImage } from "@/utils/ocr";
import { OCRImageData } from "@quicktalog/common";
import { useState } from "react";
import { BiScan } from "react-icons/bi";
import { createWorker, OEM } from "tesseract.js";
import FileUpload from "./ocr/FileUpload";
import ImageGrid from "./ocr/ImageGrid";
import ProcessingSummary from "./ocr/ProcessingSummary";

interface OCRImportProps {
	formData: GeneralInformationInputProps["formData"];
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
			Sentry.captureException(error);
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
			Sentry.captureException(error);
			console.error("Error during extraction:", error);
			alert("An error occurred during processing.");
		}
	};

	const allImagesProcessed =
		images.length > 0 && images.every((img) => img.isProcessed);
	const hasExtractedText = extractedText.trim().length > 0;

	return (
		<div className="flex flex-col items-center text-product-foreground h-fit">
			<FileUpload
				isProcessing={isProcessing}
				isSubmitting={isSubmitting}
				onImageChange={handleImageChange}
			/>
			<ImageGrid
				currentProcessingIndex={currentProcessingIndex}
				images={images}
				isProcessing={isProcessing}
				isSubmitting={isSubmitting}
				onRemoveImage={removeImage}
			/>
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
			<ProcessingSummary
				allImagesProcessed={allImagesProcessed}
				hasExtractedText={hasExtractedText}
				images={images}
			/>
		</div>
	);
};

export default OCRImport;
