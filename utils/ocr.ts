import {
	MAX_IMAGE_DIMENSION,
	MIN_EFFECTIVE_DIMENSION,
	OPTIMAL_DPI,
} from "@/constants/ocr";

export const preprocessImage = (imageFile: File): Promise<Blob | null> => {
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

// utils/language-detector.ts
export const detectLanguage = (text: string): string => {
	const patterns = [
		{ code: "chi_sim", pattern: /[\u4e00-\u9fff]/ },
		{ code: "chi_tra", pattern: /[\u4e00-\u9fff]/ },
		{ code: "jpn", pattern: /[\u3040-\u309f\u30a0-\u30ff\u4e00-\u9fff]/ },
		{
			code: "kor",
			pattern:
				/[\uac00-\ud7af\u1100-\u11ff\u3130-\u318f\ua960-\ua97f\ud7b0-\ud7ff]/,
		},
		{
			code: "ara",
			pattern:
				/[\u0600-\u06ff\u0750-\u077f\u08a0-\u08ff\ufb50-\ufdff\ufe70-\ufeff]/,
		},
		{ code: "rus", pattern: /[\u0400-\u04ff]/ },
		{ code: "hin", pattern: /[\u0900-\u097f]/ },
		{ code: "tha", pattern: /[\u0e00-\u0e7f]/ },
		{ code: "heb", pattern: /[\u0590-\u05ff]/ },
	];

	for (const { code, pattern } of patterns) {
		if (pattern.test(text)) {
			return code;
		}
	}

	return "eng";
};

// utils/ocr-parameters.ts
import { OEM, PSM } from "tesseract.js";

export const getLanguageParameters = (languageCode: string) => {
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
