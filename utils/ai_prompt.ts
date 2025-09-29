import { layouts } from "@/constants"
import { fetchImageFromUnsplash } from "@/helpers/client"
import { ServicesCategory } from "@/types"
import { NextResponse } from "next/server"

// Type definitions for better type safety
export interface GenerationRequest {
  prompt: string
  formData: {
    name: string
    title: string
    currency: string
    theme: string
    subtitle: string
  }
  shouldGenerateImages?: boolean
}

export interface GeneratedData {
  services: ServicesCategory[]
}

// Utility functions
export const createErrorResponse = (message: string, status: number) =>
  NextResponse.json({ error: message }, { status })

export const extractJSONFromResponse = (response: string): GeneratedData => {
  const cleanedText = response
    .replace(/```json/g, "")
    .replace(/```/g, "")
    .trim()

  const jsonStart = cleanedText.indexOf("{")
  const jsonEnd = cleanedText.lastIndexOf("}")

  if (jsonStart === -1 || jsonEnd === -1) {
    throw new Error("No JSON object found in response")
  }

  const jsonString = cleanedText.substring(jsonStart, jsonEnd + 1)
  const parsedData = JSON.parse(jsonString) as GeneratedData

  if (!parsedData.services || !Array.isArray(parsedData.services)) {
    throw new Error("Invalid services structure in response")
  }

  return parsedData
}

export const processImagesForServices = async (services: ServicesCategory[]): Promise<void> => {
  // Use Promise.all for concurrent image fetching instead of sequential
  const imagePromises = services
    .filter((category) => category.layout !== "variant_3")
    .flatMap((category) =>
      category.items.map(async (item) => {
        try {
          item.image = await fetchImageFromUnsplash(item.name)
        } catch (error) {
          console.warn(`Failed to fetch image for ${item.name}:`, error)
          item.image = ""
        }
      })
    )

  await Promise.all(imagePromises)
}

export const insertCatalogueData = async (
  supabase: any,
  formData: GenerationRequest["formData"],
  generatedData: GeneratedData,
  userId: string,
  slug: string
) => {
  const catalogueData = {
    name: slug,
    status: "active" as const,
    title: formData.title,
    currency: formData.currency,
    theme: formData.theme,
    subtitle: formData.subtitle,
    created_by: userId,
    logo: "",
    legal: {},
    partners: [],
    configuration: {},
    contact: [],
    services: generatedData.services,
    source: "ai_prompt",
  }

  const { error } = await supabase.from("catalogues").insert([catalogueData]).select()

  if (error) {
    throw new Error(`Failed to insert catalogue: ${error.message}`)
  }

  // Insert prompt data
  const { error: promptError } = await supabase
    .from("prompts")
    .insert([{ user_id: userId, catalogue: slug }])

  if (promptError) {
    console.warn("Failed to insert prompt data:", promptError.message)
    // Don't fail the entire request for prompt insertion failure
  }

  return slug
}

const baseCategorySchema = {
  name: "Name of category (e.g. lunch, breakfast, welness, etc.)",
  layout: "variant_1 | variant_2 | variant_3 | variant_4",
  order: 1,
  items: [
    {
      name: "Item Name",
      description: "Description of Item",
      price: 12,
      image: "leave as empty string as I will populate this later via unsplash API",
    },
  ],
}

const baseSchema = {
  services: [baseCategorySchema],
}

export function generatePromptForAI(inputText: string, formData: any) {
  const layoutData = layouts.map((l) => ({
    key: l.key,
    description: l.description,
  }))

  return `
    Role: You are an expert in creating service offers (restaurant services, beauty center service offer, etc.).
    Based on the following prompt, generate a complete service offer configuration in JSON format.
    The JSON object should strictly follow the type definition from the project.
    
    Prompt: ${inputText}
    
    Schema: ${JSON.stringify(baseSchema)}

    Layouts keys and description of each variant: ${JSON.stringify(layoutData)}. According to it use different variants for different purpose. For drinks for example use without image.

    General information about service catalogue: ${JSON.stringify(formData)}
    
    IMPORTANT REQUIREMENTS:
    1. Return ONLY the JSON object, no additional text, explanations, or formatting
    2. Start your response directly with { and end with }
    3. Service offer should be created in the language and alphabet of the prompt.
    4. The services field should be an ARRAY of categories, NOT an object
    5. Add at least 3 categories with at least 5 items each
    6. Name all items in full name of the dish e.g. "Spaghetti Carbonara", "Caesar Salad", "Pizza Margarita" etc.
    7. Ensure the JSON is valid and well-formed
    8. Set order for each category starting from 1. Order items in logical way. They will be displayed in this ascending order.
    9. Wherever you have string it should be valid string. It should not contain any special character like /,-,",' etc."
    `
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
      `
}
