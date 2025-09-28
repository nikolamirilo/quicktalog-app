import { fetchImageFromUnsplash } from "@/helpers/client"
import {
  createErrorResponse,
  extractJSONFromResponse,
  GeneratedData,
  generatePromptForAI,
  GenerationRequest,
  insertCatalogueData,
} from "@/utils/ai_prompt"
import { chatCompletion } from "@/utils/deepseek"
import { createClient } from "@/utils/supabase/server"
import { currentUser } from "@clerk/nextjs/server"
import { NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  try {
    // Early validation and parsing
    const body = (await req.json()) as GenerationRequest
    const { prompt, formData, shouldGenerateImages } = body

    if (!prompt?.trim()) {
      return createErrorResponse("Prompt is required", 400)
    }

    if (!formData?.name?.trim()) {
      return createErrorResponse("Service name is required", 400)
    }

    // Authentication check early
    const user = await currentUser()
    if (!user) {
      return createErrorResponse("User not authenticated", 401)
    }

    const supabase = await createClient()

    // Generate AI response
    const generationPrompt = generatePromptForAI(prompt, formData)
    const aiResponse = await chatCompletion(generationPrompt)

    // Parse and validate AI response
    let generatedData: GeneratedData
    try {
      generatedData = extractJSONFromResponse(aiResponse)
    } catch (parseError) {
      console.error("Failed to parse AI response:", aiResponse, parseError)
      return createErrorResponse("Invalid AI response format", 500)
    }

    for (const category of generatedData.services) {
      if (category.layout != "variant_3" && shouldGenerateImages == true) {
        for (const item of category.items) {
          item.image = await fetchImageFromUnsplash(item.name)
        }
      }
    }

    const catalogueSlug = formData.name
    await insertCatalogueData(supabase, formData, generatedData, user.id, catalogueSlug)

    return NextResponse.json({
      catalogueUrl: `/catalogues/${catalogueSlug}`,
      slug: catalogueSlug,
    })
  } catch (error) {
    console.error("Error in service generation:", error)

    // Enhanced error handling
    if (error instanceof Error) {
      const errorMessage = error.message.toLowerCase()

      if (errorMessage.includes("rate limit") || errorMessage.includes("429")) {
        return createErrorResponse("Rate limit exceeded. Please try again in a moment.", 429)
      }

      if (errorMessage.includes("unauthorized") || errorMessage.includes("401")) {
        return createErrorResponse(
          "Authentication failed. Please check your API configuration.",
          401
        )
      }

      if (errorMessage.includes("quota") || errorMessage.includes("billing")) {
        return createErrorResponse("Service quota exceeded. Please check your billing status.", 402)
      }

      // Return specific error message for known errors
      if (
        errorMessage.includes("failed to insert") ||
        errorMessage.includes("no json object") ||
        errorMessage.includes("invalid services structure")
      ) {
        return createErrorResponse(error.message, 500)
      }
    }

    // Generic fallback error
    return createErrorResponse("Failed to generate services. Please try again.", 500)
  }
}
