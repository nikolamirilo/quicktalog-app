import { ServicesCategory } from "@/types"
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
  console.log("📄 OCR Text length:", ocr_text?.length)
  console.log("📋 Form Data received:", JSON.stringify(formData, null, 2))

  const supabase = await createClient()

  // Check that either prompt or ocr_text is provided
  if (!ocr_text) {
    console.log("❌ ERROR: OCR text is missing")
    return NextResponse.json({ error: "Ocr_text is required" }, { status: 400 })
  }

  try {
    console.log("\n🔍 === STEP 1: CATEGORY DETECTION ===")
    console.log("🔄 Generating category detection prompt...")

    // Step 1: Detect categories and split text into chunks
    const categoryDetectionPrompt = generatePromptForCategoryDetection(ocr_text)
    console.log(
      "📝 Category detection prompt created (length:",
      categoryDetectionPrompt.length,
      ")"
    )
    console.log("📤 Sending category detection request to DeepSeek...")

    const categoryDetectionResponse = await chatCompletion(categoryDetectionPrompt)
    console.log("📥 Category detection response received:")
    console.log("🔍 Raw response:", categoryDetectionResponse)

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
      console.log("✂️ Extracted JSON text:", cleanedText)

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
      categoryChunks.forEach((chunk, index) => {
        console.log(`📦 Chunk ${index + 1}:`, chunk.substring(0, 150) + "...")
      })
    } catch (e) {
      console.error("❌ Failed to parse category detection response:", categoryDetectionResponse)
      console.error("💥 Parse error:", e)
      return NextResponse.json(
        { error: "Failed to parse category detection response" },
        { status: 500 }
      )
    }

    console.log("\n⚡ === STEP 2: PARALLEL CATEGORY PROCESSING ===")
    console.log("🔄 Processing", categoryChunks.length, "categories in parallel...")

    // Step 2: Process each category chunk in parallel
    const categoryProcessingPromises = categoryChunks.map((chunk, index) => {
      console.log(`📝 Creating prompt for category ${index + 1}...`)
      const categoryPrompt = generatePromptForCategoryProcessing(chunk, formData, index + 1)
      console.log(`📏 Prompt ${index + 1} length:`, categoryPrompt.length)
      console.log(`📤 Sending category ${index + 1} request to DeepSeek...`)
      return chatCompletion(categoryPrompt)
    })

    const categoryResponses = await Promise.all(categoryProcessingPromises)
    console.log("📥 All category responses received! Count:", categoryResponses.length)

    categoryResponses.forEach((response, index) => {
      console.log(`📄 Category ${index + 1} response:`)
      console.log("🔍 Raw response:", response)
    })

    console.log("\n🔧 === STEP 3: RESPONSE PROCESSING & VALIDATION ===")

    // Step 3: Parse and combine all category responses
    const services: ServicesCategory[] = []

    for (let i = 0; i < categoryResponses.length; i++) {
      const response = categoryResponses[i]
      console.log(`\n🔄 Processing category ${i + 1} response...`)

      try {
        console.log("🧹 Cleaning response text...")
        let cleanedText = response
          .replace(/```json/g, "")
          .replace(/```/g, "")
          .trim()

        console.log(`🔍 Category ${i + 1} cleaned text:`, cleanedText.substring(0, 200) + "...")

        const jsonStart = cleanedText.indexOf("{")
        const jsonEnd = cleanedText.lastIndexOf("}")
        console.log(`🎯 Category ${i + 1} JSON boundaries - start:`, jsonStart, "end:", jsonEnd)

        if (jsonStart === -1 || jsonEnd === -1) {
          console.error(`❌ No JSON object found in category ${i + 1} response:`, response)
          continue
        }

        cleanedText = cleanedText.substring(jsonStart, jsonEnd + 1)
        console.log(`✂️ Category ${i + 1} extracted JSON:`, cleanedText)

        const categoryData = JSON.parse(cleanedText)
        console.log(`✅ Category ${i + 1} parsed data:`, JSON.stringify(categoryData, null, 2))

        // Validate category structure
        if (categoryData && categoryData.name && Array.isArray(categoryData.items)) {
          console.log(`✅ Category ${i + 1} validated successfully:`)
          console.log(`   📛 Name: ${categoryData.name}`)
          console.log(`   🔢 Items count: ${categoryData.items.length}`)
          console.log(`   📊 Order: ${categoryData.order}`)
          console.log(`   🎨 Layout: ${categoryData.layout}`)

          services.push(categoryData)
          console.log(`🎉 Category ${i + 1} added to services array!`)
        } else {
          console.error(`❌ Invalid category structure for category ${i + 1}:`)
          console.error(`   📛 Has name: ${!!categoryData.name}`)
          console.error(`   📋 Has valid items array: ${Array.isArray(categoryData.items)}`)
          console.error(`   💾 Full data:`, categoryData)
        }
      } catch (e) {
        console.error(`💥 Failed to parse category ${i + 1} response:`, response, e)
        // Continue processing other categories even if one fails
      }
    }

    console.log("\n📊 === INITIAL SERVICES SUMMARY ===")
    console.log("🎯 Total valid services created:", services.length)

    if (services.length === 0) {
      console.log("❌ ERROR: No valid services were generated")
      return NextResponse.json({ error: "No valid services were generated" }, { status: 500 })
    }

    console.log("\n🔄 === STEP 4: CATEGORY ORDERING ===")
    console.log("🎯 Reordering categories for optimal display...")

    // Initialize orderedServices with original services as fallback
    let orderedServices: ServicesCategory[] = services

    const orderingPrompt = `You are an expert in organizing service/menu categories for optimal customer experience.

**Task**: Reorder the categories in the provided services array to create the most logical and intuitive flow for customers browsing a ${formData.title || "service catalogue"}.

**Current Categories**: ${JSON.stringify(services.map((s) => ({ name: s.name, itemCount: s.items.length })))}

**Full Services Data**: ${JSON.stringify(services)}

**Ordering Guidelines**:
1. **Natural Flow**: Follow logical progression (e.g., appetizers → mains → desserts, or morning → afternoon → evening services)
2. **Customer Journey**: Consider how customers typically browse and make decisions
3. **Popular First**: Place most important/popular categories prominently
4. **Related Grouping**: Keep similar services together
5. **Logical Ending**: End with beverages, desserts, add-ons, or supplementary services

**Context-Specific Rules**:
- **Restaurants**: Appetizers → Soups/Salads → Main Courses → Desserts → Beverages
- **Cafés**: Coffee/Tea → Breakfast → Lunch → Snacks → Desserts
- **Beauty/Wellness**: Basic services → Premium treatments → Packages → Add-ons
- **General Services**: Core services → Specialized services → Extras/Add-ons

**Requirements**:
1. Return ONLY a valid JSON array (no explanations, no markdown formatting)
2. Keep ALL existing data intact - only modify the "order" field
3. Start numbering from 1 and increment sequentially (1, 2, 3...)
4. Maintain exact structure and all properties
5. Ensure every category has a unique order number
6. The array length must match the input (${services.length} categories)

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
        console.log("⚠️ No array found in ordering response, using original services")
        orderedServices = services
      } else {
        cleanedText = cleanedText.substring(jsonStart, jsonEnd + 1)
        console.log("✂️ Extracted array JSON:", cleanedText)

        const parsedServices = JSON.parse(cleanedText)
        console.log("✅ Parsed ordering data:", JSON.stringify(parsedServices, null, 2))

        if (Array.isArray(parsedServices) && parsedServices.length === services.length) {
          // Validate that all services have required properties
          const allValid = parsedServices.every(
            (service) =>
              service &&
              service.name &&
              Array.isArray(service.items) &&
              typeof service.order === "number" &&
              service.order > 0
          )

          // Check for unique order numbers
          const orderNumbers = parsedServices.map((s) => s.order)
          const uniqueOrders = new Set(orderNumbers)
          const hasUniqueOrders = uniqueOrders.size === parsedServices.length

          if (allValid && hasUniqueOrders) {
            orderedServices = parsedServices
            console.log("🎉 Category ordering successful!")
            console.log("📊 New ordering:")
            orderedServices
              .sort((a, b) => a.order - b.order)
              .forEach((service) => {
                console.log(`   ${service.order}. ${service.name} (${service.items.length} items)`)
              })
          } else {
            console.log("⚠️ Invalid ordering structure detected:")
            console.log("   - All valid:", allValid)
            console.log("   - Unique orders:", hasUniqueOrders)
            console.log("   - Order numbers:", orderNumbers)
            orderedServices = services
          }
        } else {
          console.log("⚠️ Ordering array length mismatch:")
          console.log("   Expected:", services.length, "Received:", parsedServices?.length || 0)
          orderedServices = services
        }
      }
    } catch (e) {
      console.error("💥 Failed to parse category ordering response:", e)
      console.log("⚠️ Using original services order due to parsing error")
      orderedServices = services
    }

    console.log("\n📊 === FINAL SERVICES SUMMARY ===")
    console.log("🎯 Total services after ordering:", orderedServices.length)

    orderedServices
      .sort((a, b) => a.order - b.order)
      .forEach((service, index) => {
        console.log(`📋 Service ${index + 1}:`)
        console.log(`   📛 Name: ${service.name}`)
        console.log(`   🔢 Items: ${service.items?.length || 0}`)
        console.log(`   📊 Order: ${service.order}`)
        console.log(`   🎨 Layout: ${service.layout}`)
      })

    console.log("\n🔐 === STEP 5: USER AUTHENTICATION ===")
    const user = await currentUser()

    if (!user) {
      console.log("❌ ERROR: User not authenticated")
      return NextResponse.json({ error: "User not authenticated" }, { status: 401 })
    }

    console.log("✅ User authenticated successfully:")
    console.log("   🆔 User ID:", user.id)

    console.log("\n🏷️ === STEP 6: SLUG GENERATION ===")
    // Generate unique restaurant slug
    const baseSlug = formData.name.toLowerCase().replace(/\s+/g, "-")
    let catalogueSlug = baseSlug
    let counter = 1

    console.log("📝 Base slug generated:", baseSlug)

    // Check if slug already exists and make it unique
    while (true) {
      console.log("🔍 Checking if slug exists:", catalogueSlug)

      const { data: existingServiceCatalogue } = await supabase
        .from("catalogues")
        .select("name")
        .eq("name", catalogueSlug)
        .single()

      if (!existingServiceCatalogue) {
        console.log("✅ Slug is unique:", catalogueSlug)
        break
      }

      catalogueSlug = `${baseSlug}-${counter}`
      counter++
      console.log("⚠️ Slug already exists, trying:", catalogueSlug)
    }

    console.log("🏷️ Final catalogue slug:", catalogueSlug)

    console.log("\n💾 === STEP 7: DATABASE OPERATIONS ===")

    const catalogueData = {
      name: baseSlug,
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
      services: orderedServices,
    }

    console.log("📋 Catalogue data prepared:")
    console.log("   📛 Name:", catalogueData.name)
    console.log("   📊 Status:", catalogueData.status)
    console.log("   🎯 Title:", catalogueData.title)
    console.log("   💰 Currency:", catalogueData.currency)
    console.log("   🎨 Theme:", catalogueData.theme)
    console.log("   📝 Subtitle:", catalogueData.subtitle)
    console.log("   👤 Created by:", catalogueData.created_by)
    console.log("   🛍️ Services count:", catalogueData.services.length)
    console.log(
      "   📊 Final service order:",
      catalogueData.services.map((s) => `${s.order}. ${s.name}`).join(", ")
    )

    console.log("💾 Inserting catalogue data into database...")

    const { error } = await supabase.from("catalogues").insert([catalogueData]).select()

    if (error) {
      console.error("❌ Error inserting data into Supabase catalogues table:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log("✅ Catalogue inserted successfully!")

    console.log("💾 Inserting prompt record...")
    const { error: errorPrompt } = await supabase
      .from("prompts")
      .insert([{ user_id: user.id, service_catalogue: catalogueSlug }])
    if (errorPrompt) {
      console.error("❌ Error inserting data into Supabase prompt table:", errorPrompt)
      return NextResponse.json({ error: errorPrompt.message }, { status: 500 })
    }

    console.log("✅ Prompt record inserted successfully!")

    console.log("\n🎉 === PROCESS COMPLETED SUCCESSFULLY ===")
    const finalUrl = `/catalogues/${catalogueSlug}`
    console.log("🔗 Restaurant URL:", finalUrl)
    console.log("🎯 Total processing steps completed: 7")
    console.log("📊 Final services count:", orderedServices.length)
    console.log(
      "🔄 Categories properly ordered:",
      orderedServices.map((s) => `${s.order}. ${s.name}`).join(" → ")
    )

    return NextResponse.json({ restaurantUrl: finalUrl })
  } catch (error) {
    console.error("\n💥 === CRITICAL ERROR OCCURRED ===")
    console.error("🚨 Error generating services:", error)
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
    return NextResponse.json({ error: "Failed to generate services" }, { status: 500 })
  } finally {
    const end = performance.now()
    console.log(`myFunction took ${(end - start).toFixed(2)} ms`)
  }
}
