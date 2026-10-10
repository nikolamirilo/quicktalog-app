import {
	MAX_IMAGE_DIMENSION,
	MIN_EFFECTIVE_DIMENSION,
	OPTIMAL_DPI,
} from "@/constants/ocr";
import { createWorker, OEM, PSM } from "tesseract.js";

const preprocessImage = (imageFile: File): Promise<Blob | null> => {
	return new Promise((resolve) => {
		const reader = new FileReader();
		reader.onload = (e) => {
			const img = new Image();
			img.onload = () => {
				const canvas = document.createElement("canvas");
				const ctx = canvas.getContext("2d");

				if (!ctx) {
					console.error("Could not get 2D context for canvas.");
					resolve(null);
					return;
				}

				let { width: originalWidth, height: originalHeight } = img;

				// Calculate optimal dimensions
				let newWidth = originalWidth;
				let newHeight = originalHeight;

				const dpiScaleFactor = OPTIMAL_DPI / 72;
				newWidth = Math.round(originalWidth * dpiScaleFactor);
				newHeight = Math.round(originalHeight * dpiScaleFactor);

				// Apply size constraints
				if (newWidth > MAX_IMAGE_DIMENSION || newHeight > MAX_IMAGE_DIMENSION) {
					const aspectRatio = newWidth / newHeight;
					if (newWidth > newHeight) {
						newWidth = MAX_IMAGE_DIMENSION;
						newHeight = Math.round(MAX_IMAGE_DIMENSION / aspectRatio);
					} else {
						newHeight = MAX_IMAGE_DIMENSION;
						newWidth = Math.round(MAX_IMAGE_DIMENSION * aspectRatio);
					}
				}

				// Ensure minimum dimensions
				if (
					newWidth < MIN_EFFECTIVE_DIMENSION ||
					newHeight < MIN_EFFECTIVE_DIMENSION
				) {
					const aspectRatio = newWidth / newHeight;
					if (aspectRatio > 1) {
						newWidth = Math.max(newWidth, MIN_EFFECTIVE_DIMENSION);
						newHeight = Math.round(newWidth / aspectRatio);
					} else {
						newHeight = Math.max(newHeight, MIN_EFFECTIVE_DIMENSION);
						newWidth = Math.round(newHeight * aspectRatio);
					}
				}

				canvas.width = newWidth;
				canvas.height = newHeight;

				// High-quality rendering
				ctx.imageSmoothingEnabled = true;
				ctx.imageSmoothingQuality = "high";
				ctx.drawImage(img, 0, 0, newWidth, newHeight);

				// Convert to grayscale and apply thresholding
				const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
				const data = imageData.data;

				for (let i = 0; i < data.length; i += 4) {
					const gray = Math.round(
						0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2],
					);
					const threshold = 128;
					const binaryValue = gray > threshold ? 255 : 0;

					data[i] = binaryValue;
					data[i + 1] = binaryValue;
					data[i + 2] = binaryValue;
				}

				ctx.putImageData(imageData, 0, 0);

				// Add border
				const borderSize = 20;
				const borderedCanvas = document.createElement("canvas");
				const borderedCtx = borderedCanvas.getContext("2d");

				if (borderedCtx) {
					borderedCanvas.width = canvas.width + borderSize * 2;
					borderedCanvas.height = canvas.height + borderSize * 2;

					borderedCtx.fillStyle = "white";
					borderedCtx.fillRect(
						0,
						0,
						borderedCanvas.width,
						borderedCanvas.height,
					);
					borderedCtx.drawImage(canvas, borderSize, borderSize);

					borderedCanvas.toBlob(
						(blob) => {
							resolve(blob || null);
						},
						"image/png",
						1.0,
					);
				} else {
					canvas.toBlob(
						(blob) => {
							resolve(blob);
						},
						"image/png",
						1.0,
					);
				}
			};
			img.src = e.target?.result as string;
		};
		reader.readAsDataURL(imageFile);
	});
};

const getLanguageParameters = (languageCode: string) => {
	const baseParams = {
		tessedit_pageseg_mode: PSM.AUTO,
		tessedit_ocr_engine_mode: OEM.LSTM_ONLY,
		preserve_interword_spaces: "1",
	};

	const languageParams: { [key: string]: any } = {
		chi_sim: {
			...baseParams,
			tessedit_pageseg_mode: PSM.SINGLE_BLOCK,
			tessedit_char_whitelist: "",
		},
		chi_tra: {
			...baseParams,
			tessedit_pageseg_mode: PSM.SINGLE_BLOCK,
			tessedit_char_whitelist: "",
		},
		jpn: {
			...baseParams,
			tessedit_pageseg_mode: PSM.SINGLE_BLOCK,
			tessedit_char_whitelist: "",
		},
		kor: {
			...baseParams,
			tessedit_pageseg_mode: PSM.SINGLE_BLOCK,
		},
		ara: {
			...baseParams,
			tessedit_pageseg_mode: PSM.SINGLE_BLOCK,
		},
		rus: {
			...baseParams,
			tessedit_char_whitelist: "",
		},
		srp: {
			...baseParams,
			tessedit_char_whitelist: "",
		},
		srp_latn: {
			...baseParams,
			tessedit_char_whitelist:
				"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyzČčĆćĐđŠšŽž0123456789.,!?;:()[]{}\"-' ",
		},
	};

	return languageParams[languageCode] || baseParams;
};

/** Tesseract ships no Serbian Latin model; Croatian uses the same alphabet. */
const LANGUAGE_ALIASES: Record<string, string> = { srp_latn: "hrv" };

const resolveOcrLanguage = (language?: string): string => {
	const code = language || "eng";
	return LANGUAGE_ALIASES[code] ?? code;
};

export interface OcrScan {
	text: string;
	/** Tesseract's own 0-100 estimate of how much of that text it trusts. */
	confidence: number;
}

/**
 * Reads a batch of images, reporting each one as it lands so the caller can
 * show progress.
 *
 * One worker serves the whole batch: spinning one up per image re-fetches the
 * language data and costs about a second each time, which is the difference
 * between a ten-image scan feeling instant and feeling broken. A single image
 * that fails is reported as `null` and the rest of the batch still runs.
 */
export const recognizeImages = async (
	images: ReadonlyArray<{ id: string; file: File }>,
	language: string | undefined,
	onResult: (id: string, scan: OcrScan | null) => void,
): Promise<void> => {
	if (images.length === 0) return;

	const code = resolveOcrLanguage(language);
	const worker = await createWorker(code, OEM.LSTM_ONLY);

	try {
		await worker.setParameters(getLanguageParameters(code));

		for (const { id, file } of images) {
			try {
				const preprocessed = await preprocessImage(file);
				if (!preprocessed) {
					onResult(id, null);
					continue;
				}

				const prepared = new File([preprocessed], "processed-image.png", {
					type: "image/png",
				});
				const { data } = await worker.recognize(prepared);
				onResult(id, { text: data.text, confidence: data.confidence });
			} catch (error) {
				console.error("OCR recognition failed:", error);
				onResult(id, null);
			}
		}
	} finally {
		await worker.terminate();
	}
};
