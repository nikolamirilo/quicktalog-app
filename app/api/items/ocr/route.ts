import { chatCompletion } from "@/utils/deepseek";
import {
	generateOrderPrompt,
	generatePromptForCategoryDetection,
	generatePromptForCategoryProcessing,
} from "@/utils/ocr";
import { createClient } from "@/utils/supabase/server";
import { currentUser } from "@clerk/nextjs/server";
import { CatalogueCategory, generateUniqueSlug } from "@quicktalog/common";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
	console.log("🚀 === OCR PROCESSING STARTED ===");
	const start = performance.now();
	const { ocr_text, formData } = await req.json();
	const supabase = await createClient();

	if (!ocr_text) {
		console.log("❌ ERROR: OCR text is missing");
		return NextResponse.json(
			{ error: "Ocr_text is required" },
			{ status: 400 },
		);
	}

	try {
		console.log("\n🔍 === STEP 1: CATEGORY DETECTION ===");
		const categoryDetectionPrompt =
			generatePromptForCategoryDetection(ocr_text);
		const categoryDetectionResponse = await chatCompletion(
			categoryDetectionPrompt,
		);

		let categoryChunks: string[] = [];
		try {
			console.log("🔧 Parsing category detection response...");
			let cleanedOrderingResponse = categoryDetectionResponse
				.replace(/```json/g, "")
				.replace(/```/g, "")
				.trim();
			console.log("🧹 Cleaned text:", cleanedOrderingResponse);

			const arrayStart = cleanedOrderingResponse.indexOf("{");
			const arrayEnd = cleanedOrderingResponse.lastIndexOf("}");
			console.log("🎯 JSON boundaries - start:", arrayStart, "end:", arrayEnd);

			if (arrayStart === -1 || arrayEnd === -1) {
				throw new Error("No JSON object found in category detection response");
			}

			cleanedOrderingResponse = cleanedOrderingResponse.substring(
				arrayStart,
				arrayEnd + 1,
			);
			const categoryData = JSON.parse(cleanedOrderingResponse);
			console.log(
				"✅ Parsed category data:",
				JSON.stringify(categoryData, null, 2),
			);

			if (!Array.isArray(categoryData.chunks)) {
				console.log(
					"❌ ERROR: chunks is not an array:",
					typeof categoryData.chunks,
					categoryData.chunks,
				);
				throw new Error(
					"Invalid chunks structure in category detection response",
				);
			}

			categoryChunks = categoryData.chunks;
			console.log(
				"🎉 Successfully extracted",
				categoryChunks.length,
				"category chunks:",
			);
		} catch (error) {
			console.error(
				"❌ Failed to parse category detection response:",
				categoryDetectionResponse,
			);
			return NextResponse.json(
				{
					error: "Failed to parse category detection response",
					details: error,
				},
				{ status: 500 },
			);
		}

		console.log("\n⚡ === STEP 2: PARALLEL CATEGORY PROCESSING ===");
		console.log(
			"🔄 Processing",
			categoryChunks.length,
			"categories in parallel...",
		);

		const categoryProcessingPromises = categoryChunks.map((chunk, index) => {
			const categoryPrompt = generatePromptForCategoryProcessing(
				chunk,
				formData,
				index + 1,
			);
			return chatCompletion(categoryPrompt);
		});

		const categoryResponses = await Promise.all(categoryProcessingPromises);
		console.log(
			"📥 All category responses received! Count:",
			categoryResponses.length,
		);

		console.log("\n🔧 === STEP 3: RESPONSE PROCESSING & VALIDATION ===");
		const items: CatalogueCategory[] = [];

		for (let i = 0; i < categoryResponses.length; i++) {
			const response = categoryResponses[i];
			try {
				let cleanedOrderingResponse = response
					.replace(/```json/g, "")
					.replace(/```/g, "")
					.trim();

				const arrayStart = cleanedOrderingResponse.indexOf("{");
				const arrayEnd = cleanedOrderingResponse.lastIndexOf("}");
				console.log(
					`🎯 Category ${i + 1} JSON boundaries - start:`,
					arrayStart,
					"end:",
					arrayEnd,
				);

				if (arrayStart === -1 || arrayEnd === -1) {
					console.error(
						`❌ No JSON object found in category ${i + 1} response:`,
						response,
					);
					continue;
				}

				cleanedOrderingResponse = cleanedOrderingResponse.substring(
					arrayStart,
					arrayEnd + 1,
				);

				const categoryData = JSON.parse(cleanedOrderingResponse);
				console.log(
					`✅ Category ${i + 1} parsed data:`,
					JSON.stringify(categoryData, null, 2),
				);
				if (
					categoryData &&
					categoryData.name &&
					Array.isArray(categoryData.items)
				) {
					items.push(categoryData);
					console.log(`🎉 Category ${i + 1} added to items array!`);
				} else {
					console.error(`❌ Invalid category structure for category ${i + 1}:`);
					console.error(`   📛 Has name: ${!!categoryData.name}`);
				}
			} catch (e) {
				console.error(
					`💥 Failed to parse category ${i + 1} response:`,
					response,
					e,
				);
			}
		}

		console.log("\n📊 === INITIAL ITEMS SUMMARY ===");
		console.log("🎯 Total valid items created:", items.length);

		if (items.length === 0) {
			console.log("❌ ERROR: No valid items were generated");
			return NextResponse.json(
				{ error: "No valid items were generated" },
				{ status: 500 },
			);
		}

		console.log("\n🔄 === STEP 4: CATEGORY ORDERING ===");

		let orderedItems: CatalogueCategory[] = items;

		const orderingPrompt = generateOrderPrompt(items, formData);

		try {
			const orderingResponse = await chatCompletion(orderingPrompt);
			console.log("📥 Category ordering response received:");
			console.log("🔍 Raw response:", orderingResponse);

			let cleanedOrderingResponse = orderingResponse
				.replace(/```json/g, "")
				.replace(/```/g, "")
				.trim();

			console.log("🧹 Cleaned ordering text:", cleanedOrderingResponse);

			const arrayStart = cleanedOrderingResponse.indexOf("[");
			const arrayEnd = cleanedOrderingResponse.lastIndexOf("]");

			if (arrayStart === -1 || arrayEnd === -1) {
				console.log(
					"⚠️ No valid array found in AI response. Using original order.",
				);
				orderedItems = items;
			} else {
				const extracted = cleanedOrderingResponse.substring(
					arrayStart,
					arrayEnd + 1,
				);
				const parsedNames = JSON.parse(extracted);

				if (Array.isArray(parsedNames) && parsedNames.length === items.length) {
					console.log("✅ Parsed valid array of category names:", parsedNames);

					const nameToItem = new Map(items.map((item) => [item.name, item]));

					orderedItems = parsedNames
						.map((name, index) => {
							const original = nameToItem.get(name);
							return original ? { ...original, order: index } : null;
						})
						.filter(Boolean);

					console.log("🎉 Category ordering successful!");
					orderedItems.forEach((service) => {
						console.log(
							`   ${service.order}. ${service.name} (${service.items.length} items)`,
						);
					});
				} else {
					console.log("⚠️ Ordering array invalid or length mismatch:");
					console.log(
						"   Expected:",
						items.length,
						"Received:",
						parsedNames?.length || 0,
					);
					orderedItems = items;
				}
			}
		} catch (e) {
			console.error("💥 Failed to parse category ordering response:", e);
			orderedItems = items;
		}

		console.log("\n📊 === FINAL ITEMS SUMMARY ===");

		orderedItems
			.sort((a, b) => a.order - b.order)
			.forEach((service, index) => {
				console.log(`📋 ${index + 1}. ${service.name}`);
			});

		console.log("\n === STEP 5: SLUG GENERATION ===");
		const user = await currentUser();

		console.log("\n === STEP 7: DATABASE OPERATIONS ===");

		const slug = generateUniqueSlug(formData.name);

		const catalogueData = {
			name: slug || formData.name,
			status: "active",
			title: formData.title,
			currency: formData.currency,
			theme: formData.theme,
			subtitle: formData.subtitle,
			createdBy: user.id,
			logo: "",
			legal: {},
			partners: [],
			configuration: {},
			contact: [],
			services: orderedItems,
			source: "ocr_import",
		};

		const { error } = await supabase
			.from("catalogues")
			.insert([catalogueData])
			.select();

		if (error) {
			console.error(
				"❌ Error inserting data into Supabase catalogues table:",
				error,
			);
			return NextResponse.json({ error: error.message }, { status: 500 });
		}

		console.log("✅ Catalogue created successfully!");

		console.log("💾 Inserting prompt record...");
		const { error: errorOcrUsageEntry } = await supabase
			.from("ocr")
			.insert([{ user_id: user.id }]);
		if (errorOcrUsageEntry) {
			console.error(
				"❌ Error inserting data into Supabase prompt table:",
				errorOcrUsageEntry,
			);
			return NextResponse.json(
				{ error: errorOcrUsageEntry.message },
				{ status: 500 },
			);
		}

		console.log("\n🎉 === PROCESS COMPLETED SUCCESSFULLY ===");
		const finalUrl = `/catalogues/${formData.name}`;
		console.log(
			"🔄 Categories properly ordered:",
			orderedItems.map((s) => `${s.order}. ${s.name}`).join(" → "),
		);

		return NextResponse.json({ restaurantUrl: finalUrl });
	} catch (error) {
		console.error("\n💥 === CRITICAL ERROR OCCURRED ===");
		console.error("🚨 Error generating items:", error);
		console.error(
			"💬 Error message:",
			error instanceof Error ? error.message : "Unknown error",
		);

		// Handle specific API errors
		if (error instanceof Error) {
			if (error.message.includes("rate limit")) {
				console.log("⚠️ Rate limit error detected");
				return NextResponse.json(
					{
						error: "Rate limit exceeded. Please try again in a moment.",
					},
					{ status: 429 },
				);
			}
			if (error.message.includes("401")) {
				console.log("🔐 API key error detected");
				return NextResponse.json(
					{
						error: "Invalid API key configuration.",
					},
					{ status: 500 },
				);
			}
		}
		console.log("❌ Returning generic error response");
		return NextResponse.json(
			{ error: "Failed to generate items" },
			{ status: 500 },
		);
	} finally {
		const end = performance.now();
		const durationMs = end - start;
		const durationSec = durationMs / 1000;
		const minutes = Math.floor(durationSec / 60);
		const seconds = (durationSec % 60).toFixed(2);

		console.log(`myFunction took ${minutes} min ${seconds} sec`);
	}
}
