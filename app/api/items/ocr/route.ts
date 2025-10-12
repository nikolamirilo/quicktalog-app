import { CatalogueCategory } from "@/types"
import {
  chatCompletion,
  generatePromptForCategoryDetection,
  generatePromptForCategoryProcessing,
} from "@/utils/deepseek"
import { createClient } from "@/utils/supabase/server"
import { currentUser } from "@clerk/nextjs/server"
import { NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  console.log("🚀 === OCR PROCESSING STARTED ===")
  const start = performance.now()
  const { ocr_text, formData } = await req.json()
  const supabase = await createClient()

  if (!ocr_text) {
    console.log("❌ ERROR: OCR text is missing")
    return NextResponse.json({ error: "Ocr_text is required" }, { status: 400 })
  }

  try {
    console.log("\n🔍 === STEP 1: CATEGORY DETECTION ===")
    const categoryDetectionPrompt = generatePromptForCategoryDetection(ocr_text)
    const categoryDetectionResponse = await chatCompletion(categoryDetectionPrompt)

    let categoryChunks: string[] = []
    try {
      console.log("🔧 Parsing category detection response...")
      let cleanedText = categoryDetectionResponse
        .replace(/```json/g, "")
        .replace(/```/g, "")
        .trim()
      console.log("🧹 Cleaned text:", cleanedText)

      const jsonStart = cleanedText.indexOf("{")
      const jsonEnd = cleanedText.lastIndexOf("}")
      console.log("🎯 JSON boundaries - start:", jsonStart, "end:", jsonEnd)

      if (jsonStart === -1 || jsonEnd === -1) {
        throw new Error("No JSON object found in category detection response")
      }

      cleanedText = cleanedText.substring(jsonStart, jsonEnd + 1)
      const categoryData = JSON.parse(cleanedText)
      console.log("✅ Parsed category data:", JSON.stringify(categoryData, null, 2))

      if (!Array.isArray(categoryData.chunks)) {
        console.log(
          "❌ ERROR: chunks is not an array:",
          typeof categoryData.chunks,
          categoryData.chunks
        )
        throw new Error("Invalid chunks structure in category detection response")
      }

      categoryChunks = categoryData.chunks
      console.log("🎉 Successfully extracted", categoryChunks.length, "category chunks:")
    } catch (e) {
      console.error("❌ Failed to parse category detection response:", categoryDetectionResponse)
      return NextResponse.json(
        { error: "Failed to parse category detection response" },
        { status: 500 }
      )
    }

    console.log("\n⚡ === STEP 2: PARALLEL CATEGORY PROCESSING ===")
    console.log("🔄 Processing", categoryChunks.length, "categories in parallel...")

    const categoryProcessingPromises = categoryChunks.map((chunk, index) => {
      const categoryPrompt = generatePromptForCategoryProcessing(chunk, formData, index + 1)
      return chatCompletion(categoryPrompt)
    })

    const categoryResponses = await Promise.all(categoryProcessingPromises)
    console.log("📥 All category responses received! Count:", categoryResponses.length)

    console.log("\n🔧 === STEP 3: RESPONSE PROCESSING & VALIDATION ===")
    const items: CatalogueCategory[] = []

    for (let i = 0; i < categoryResponses.length; i++) {
      const response = categoryResponses[i]
      try {
        let cleanedText = response
          .replace(/```json/g, "")
          .replace(/```/g, "")
          .trim()

        const jsonStart = cleanedText.indexOf("{")
        const jsonEnd = cleanedText.lastIndexOf("}")
        console.log(`🎯 Category ${i + 1} JSON boundaries - start:`, jsonStart, "end:", jsonEnd)

        if (jsonStart === -1 || jsonEnd === -1) {
          console.error(`❌ No JSON object found in category ${i + 1} response:`, response)
          continue
        }

        cleanedText = cleanedText.substring(jsonStart, jsonEnd + 1)

        const categoryData = JSON.parse(cleanedText)
        console.log(`✅ Category ${i + 1} parsed data:`, JSON.stringify(categoryData, null, 2))
        if (categoryData && categoryData.name && Array.isArray(categoryData.items)) {
          items.push(categoryData)
          console.log(`🎉 Category ${i + 1} added to items array!`)
        } else {
          console.error(`❌ Invalid category structure for category ${i + 1}:`)
          console.error(`   📛 Has name: ${!!categoryData.name}`)
        }
      } catch (e) {
        console.error(`💥 Failed to parse category ${i + 1} response:`, response, e)
      }
    }

    console.log("\n📊 === INITIAL ITEMS SUMMARY ===")
    console.log("🎯 Total valid items created:", items.length)

    if (items.length === 0) {
      console.log("❌ ERROR: No valid items were generated")
      return NextResponse.json({ error: "No valid items were generated" }, { status: 500 })
    }

    console.log("\n🔄 === STEP 4: CATEGORY ORDERING ===")
    console.log("🎯 Reordering categories for optimal display...")

    // Initialize orderedItems with original items as fallback
    let orderedItems: CatalogueCategory[] = items

    const orderingPrompt = `You are an expert in organizing service/menu categories for optimal customer experience.

**Task**: Reorder the categories in the provided items array to create the most logical and intuitive flow for customers browsing a ${formData.title || "service catalogue"}.

**Current Categories**: ${JSON.stringify(items.map((s) => ({ name: s.name, itemCount: s.items.length })))}

**Full Items Data**: ${JSON.stringify(items)}

**Ordering Guidelines**:
1. **Natural Flow**: Follow logical progression (e.g., appetizers → mains → desserts, or morning → afternoon → evening items)
2. **Customer Journey**: Consider how customers typically browse and make decisions
3. **Popular First**: Place most important/popular categories prominently
4. **Related Grouping**: Keep similar items together
5. **Logical Ending**: End with beverages, desserts, add-ons, or supplementary items

**Context-Specific Rules**:
- **Restaurants**: Appetizers → Soups/Salads → Main Courses → Desserts → Beverages
- **Cafés**: Coffee/Tea → Breakfast → Lunch → Snacks → Desserts
- **Beauty/Wellness**: Basic items → Premium treatments → Packages → Add-ons
- **General Items**: Core items → Specialized items → Extras/Add-ons

**Requirements**:
1. Return ONLY a valid JSON array (no explanations, no markdown formatting)
2. Keep ALL existing data intact - only modify the "order" field
3. Start numbering from 1 and increment sequentially (1, 2, 3...)
4. Maintain exact structure and all properties
5. Ensure every category has a unique order number
6. The array length must match the input (${items.length} categories)

**Expected Output Format**:
[{"name":"Category1","layout":"variant_3","order":1,"items":[...]}, {"name":"Category2","layout":"variant_3","order":2,"items":[...]}]`

    console.log("📝 Category ordering prompt created (length:", orderingPrompt.length, ")")
    console.log("📤 Sending category ordering request to DeepSeek...")

    try {
      const orderingResponse = await chatCompletion(orderingPrompt)
      console.log("📥 Category ordering response received:")
      console.log("🔍 Raw response:", orderingResponse)

      console.log("🔧 Parsing category ordering response...")

      let cleanedText = orderingResponse
        .replace(/```json/g, "")
        .replace(/```/g, "")
        .trim()
      console.log("🧹 Cleaned ordering text:", cleanedText)

      const jsonStart = cleanedText.indexOf("[")
      const jsonEnd = cleanedText.lastIndexOf("]")
      console.log("🎯 Array boundaries - start:", jsonStart, "end:", jsonEnd)

      if (jsonStart === -1 || jsonEnd === -1) {
        console.log("⚠️ No array found in ordering response, using original items")
        orderedItems = items
      } else {
        cleanedText = cleanedText.substring(jsonStart, jsonEnd + 1)
        console.log("✂️ Extracted array JSON:", cleanedText)

        const parsedItems = JSON.parse(cleanedText)

        if (Array.isArray(parsedItems) && parsedItems.length === items.length) {
          // Validate that all items have required properties
          const allValid = parsedItems.every(
            (service) =>
              service &&
              service.name &&
              Array.isArray(service.items) &&
              typeof service.order === "number" &&
              service.order > 0
          )

          // Check for unique order numbers
          const orderNumbers = parsedItems.map((s) => s.order)
          const uniqueOrders = new Set(orderNumbers)
          const hasUniqueOrders = uniqueOrders.size === parsedItems.length

          if (allValid && hasUniqueOrders) {
            orderedItems = parsedItems
            console.log("🎉 Category ordering successful!")
            console.log("📊 New ordering:")
            orderedItems
              .sort((a, b) => a.order - b.order)
              .forEach((service) => {
                console.log(`   ${service.order}. ${service.name} (${service.items.length} items)`)
              })
          } else {
            console.log("⚠️ Invalid ordering structure detected:")
            console.log("   - All valid:", allValid)
            orderedItems = items
          }
        } else {
          console.log("⚠️ Ordering array length mismatch:")
          console.log("   Expected:", items.length, "Received:", parsedItems?.length || 0)
          orderedItems = items
        }
      }
    } catch (e) {
      console.error("💥 Failed to parse category ordering response:", e)
      console.log("⚠️ Using original items order due to parsing error")
      orderedItems = items
    }

    console.log("\n📊 === FINAL ITEMS SUMMARY ===")
    console.log("🎯 Total items after ordering:", orderedItems.length)

    orderedItems
      .sort((a, b) => a.order - b.order)
      .forEach((service, index) => {
        console.log(`📋 ${index + 1}. ${service.name}`)
      })

    console.log("\n🏷️ === STEP 5: SLUG GENERATION ===")
    const user = await currentUser()

    console.log("\n💾 === STEP 7: DATABASE OPERATIONS ===")

    const catalogueData = {
      name: formData.name,
      status: "active",
      title: formData.title,
      currency: formData.currency,
      theme: formData.theme,
      subtitle: formData.subtitle,
      created_by: user.id,
      logo: "",
      legal: {},
      partners: [],
      configuration: {},
      contact: [],
      services: orderedItems,
      source: "ocr_import",
    }

    console.log("💾 Inserting catalogue data into database...")

    const { error } = await supabase.from("catalogues").insert([catalogueData]).select()

    if (error) {
      console.error("❌ Error inserting data into Supabase catalogues table:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log("✅ Catalogue inserted successfully!")

    console.log("💾 Inserting prompt record...")
    const { error: errorPrompt } = await supabase.from("ocr").insert([{ user_id: user.id }])
    if (errorPrompt) {
      console.error("❌ Error inserting data into Supabase prompt table:", errorPrompt)
      return NextResponse.json({ error: errorPrompt.message }, { status: 500 })
    }

    console.log("✅ Prompt record inserted successfully!")

    console.log("\n🎉 === PROCESS COMPLETED SUCCESSFULLY ===")
    const finalUrl = `/catalogues/${formData.name}`
    console.log("🔗 Restaurant URL:", finalUrl)
    console.log("🎯 Total processing steps completed: 7")
    console.log("📊 Final items count:", orderedItems.length)
    console.log(
      "🔄 Categories properly ordered:",
      orderedItems.map((s) => `${s.order}. ${s.name}`).join(" → ")
    )

    return NextResponse.json({ restaurantUrl: finalUrl })
  } catch (error) {
    console.error("\n💥 === CRITICAL ERROR OCCURRED ===")
    console.error("🚨 Error generating items:", error)
    console.error("📋 Error type:", error?.constructor?.name)
    console.error("💬 Error message:", error instanceof Error ? error.message : "Unknown error")
    console.error("📚 Error stack:", error instanceof Error ? error.stack : "No stack trace")

    // Handle specific API errors
    if (error instanceof Error) {
      if (error.message.includes("rate limit")) {
        console.log("⚠️ Rate limit error detected")
        return NextResponse.json(
          {
            error: "Rate limit exceeded. Please try again in a moment.",
          },
          { status: 429 }
        )
      }
      if (error.message.includes("401")) {
        console.log("🔐 API key error detected")
        return NextResponse.json(
          {
            error: "Invalid API key configuration.",
          },
          { status: 500 }
        )
      }
    }
    console.log("❌ Returning generic error response")
    return NextResponse.json({ error: "Failed to generate items" }, { status: 500 })
  } finally {
    const end = performance.now()
    const durationMs = end - start
    const durationSec = durationMs / 1000
    const minutes = Math.floor(durationSec / 60)
    const seconds = (durationSec % 60).toFixed(2)

    console.log(`myFunction took ${minutes} min ${seconds} sec`)
  }
}
