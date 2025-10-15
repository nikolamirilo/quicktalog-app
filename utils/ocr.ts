import { OEM, PSM } from "tesseract.js";
import {
	MAX_IMAGE_DIMENSION,
	MIN_EFFECTIVE_DIMENSION,
	OPTIMAL_DPI,
} from "@/constants/ocr";
import { CatalogueCategory } from "@/types";

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

const baseCategorySchema = {
	name: "Name of category (e.g. lunch, breakfast, welness, etc.)",
	layout: "variant",
	order: 1,
	items: [
		{
			name: "Item Name",
			description: "Description of Item",
			price: 12,
			image:
				"leave as empty string as I will populate this later via unsplash API",
		},
	],
};

export function generatePromptForCategoryDetection(ocrText: string): string {
	return `
    Role: You are an expert in analyzing digital catalogs, menus and price lists to identify categories.
    Your task is to analyze the provided OCR text and split it into logical category chunks.
    
    OCR Text: ${ocrText}
    
    IMPORTANT REQUIREMENTS:
    1. Return ONLY a JSON object with this structure: { "chunks": ["chunk1", "chunk2", ...] }
    2. Each chunk should contain all text related to one category (including the category name)
    3. Identify product/service categories like: breakfast, lunch, dinner, drinks, appetizers, desserts, wellness services, beauty treatments, laptops, mobile phones, etc.
    4. If no clear categories are found, group similar items together logically
    5. Each chunk should be a complete text section that includes:
       - The category name/title
       - All items belonging to that category
       - Any descriptions or prices for those items
    6. Do not modify the original text content, just split it appropriately
    7. Return ONLY the JSON object, no additional text or formatting
    8. Start your response directly with { and end with }
    
    Example output format:
    {
      "chunks": [
        "BREAKFAST\nScrambled Eggs 8.50\nPancakes with syrup 12.00\nFresh fruit bowl 9.00",
        "LUNCH\nCaesar Salad 14.00\nGrilled Chicken Sandwich 16.50\nTomato Soup 8.00",
        "DRINKS\nCoffee 3.50\nOrange Juice 4.00\nSparkling Water 2.50"
      ]
    }
  `;
}

export function generatePromptForCategoryProcessing(
	categoryChunk: string,
	formData: any,
	order: number,
): string {
	return `
    Role: You are an expert in creating service category configurations.
    Based on the provided category text chunk, generate a single category object in JSON format.
    
    Category Text Chunk: ${categoryChunk}
    
    Schema for single category: ${JSON.stringify(baseCategorySchema)}
    
    General information about service catalogue: ${JSON.stringify(formData)}
    
    IMPORTANT REQUIREMENTS:
    0. If category name/item name/item description contain some strange words (e.g. "Jelapogodnazavoganje") correct them to what makes sense (e.g. "Jela pogodna za vegetarijance"). So make corrections in text to be correct on semantic and grammar side and to be clear for customer.
    1. Return ONLY the JSON object for ONE category, no additional text or formatting
    2. Start your response directly with { and end with }
    3. Extract the category name from the text chunk
    4. Set layout to "variant_3"
    5. Set order to ${order}
    6. Create items array with all items found in this category chunk
    7. If prices are missing, estimate reasonable prices based on currency: ${formData.currency}
    8. Service should be created in the language and alphabet of the text
    9. Ensure all strings are properly escaped and contain no special characters like /,-,",' that could break JSON
    10. Item names should be full descriptive names
    11. Provide meaningful descriptions for items when possible
    12. Set image field as empty string for all items
    
    Example output:
    {
      "name": "Breakfast",
      "layout": "variant_3",
      "order": ${order},
      "items": [
        {
          "name": "Scrambled Eggs",
          "description": "Fresh scrambled eggs served with toast",
          "price": 8.50,
          "image": ""
        }
      ]
    }
  `;
}
export function generateOrderPrompt(
	items: CatalogueCategory[],
	formData: any,
): string {
	return `You are an expert in organizing service or menu categories to optimize the customer browsing experience.

**Task**: Reorder and, if necessary, rename the categories in the provided items array to create a logical, intuitive flow for customers browsing a ${formData.title || "catalogue"}.

**Input Categories**: ${JSON.stringify(items.map((category: CatalogueCategory) => category.name))}

**Ordering Guidelines**:
1. **Logical Progression**: Arrange categories in a natural sequence (e.g., appetizers → mains → desserts, or morning → afternoon → evening).
2. **Customer Journey**: Prioritize how customers typically browse and make selections.
3. **Closing Categories**: Place beverages, desserts, add-ons, or supplementary items at the end.

**Context-Specific Rules**:
- **Restaurants**: Appetizers → Soups/Salads → Main Courses → Desserts → Beverages
- **Cafés**: Coffee/Tea → Breakfast → Lunch → Snacks → Desserts
- **Beauty/Wellness**: Basic Services → Premium Treatments → Packages → Add-ons
- **General Catalogue**: Core Items → Specialized Items → Extras/Add-ons

**Requirements**:
1. Return a valid JSON array containing only category names (strings).
2. Match the input array length (${items.length} categories).
3. Preserve exact spelling of input category names unless renaming is needed.
4. Ensure category names:
   - Are in ${formData.language || "English"} with consistent capitalization (e.g., First letter capitalized, rest lowercase).
   - Are clear, unique, and self-explanatory.
   - Contain no special characters (e.g., /, -, ", ').
   - Are semantically and grammatically appropriate for the catalogue context.
5. Ensure items names:
	- Are descriptive and clear
	- Contain no special characters (e.g., /, -, ", ')
	- Are semantically and grammatically correct
	- Are unique within the category
**Output Format Example**:
["Breakfast", "Lunch", "Dinner", "Desserts", "Beverages"]`;
}
