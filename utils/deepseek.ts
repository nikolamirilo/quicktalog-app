import OpenAI from "openai";

const openai = new OpenAI({
	baseURL: "https://api.deepseek.com",
	apiKey: process.env.DEEPSEEK_API_KEY,
});

export async function chatCompletion(prompt: string) {
	const completion = await openai.chat.completions.create({
		messages: [{ role: "system", content: prompt }],
		model: "deepseek-chat",
	});
	return completion.choices[0].message.content;
}

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

const baseSchema = {
	services: [baseCategorySchema],
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

export function generatePromptForOCR(inputText: string, formData: any): string {
	return `
      Role: You are an expert in creating service offers (restaurant services, beauty center service offer, etc.).
      Based on the following prompt, generate a complete service offer configuration in JSON format.
      The JSON object should strictly follow the type definition from the project.
      
      Prompt: Create services array based on text extracted from service catalogue: ${inputText}
      
      Schema: ${JSON.stringify(baseSchema)}

    For layout use always variant_3

    Detect categories in text (breakfast, lunch, etc.) if you dont see it there group items by similarity. 

    General information about service catalogue: ${JSON.stringify(formData)}
      
      IMPORTANT REQUIREMENTS:
      1. Return ONLY the JSON object, no additional text, explanations, or formatting
      2. Start your response directly with { and end with }
      3. Service offer should be created in the language and alphabet of the text.
      4. Ensure the JSON is valid and well-formed  
      5. If you cannot find price for an item, you set price. Keep in mind currency and make sure price is not 0.
      6. Set order for each category starting from 1. Order items in logical way. They will be displayed in this ascending order.
      7. Wherecver you have string it should be valid string. It should not contain any special character like /,-,",' etc."
      `;
}
