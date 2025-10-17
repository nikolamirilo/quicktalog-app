import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function GET(request: NextRequest) {
	const startTime = Date.now();

	try {
		// Validate environment variables
		if (
			!process.env.POSTHOG_API_KEY ||
			!process.env.POSTHOG_PROJECT_ID ||
			!process.env.NEXT_PUBLIC_POSTHOG_HOST
		) {
			console.error("Missing required environment variables");
			return NextResponse.json(
				{ error: "Missing PostHog configuration" },
				{ status: 500 },
			);
		}

		const supabase = await createClient();

		// Get yesterday's data (previous 24 hours)
		const endDate = new Date();
		endDate.setHours(0, 0, 0, 0); // Today at midnight

		const startDate = new Date(endDate);
		startDate.setDate(startDate.getDate() - 1); // Yesterday at midnight

		const res = await fetch(
			`${process.env.NEXT_PUBLIC_POSTHOG_HOST}/api/projects/${process.env.POSTHOG_PROJECT_ID}/query/`,
			{
				method: "POST",
				headers: {
					Authorization: `Bearer ${process.env.POSTHOG_API_KEY}`,
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					query: {
						kind: "HogQLQuery",
						query: `SELECT 
    toDate(timestamp) AS date,
    formatDateTime(timestamp, '%H:00') AS hour,
    properties.$current_url AS current_url,
    COUNT(*) AS pageview_count,
    COUNT(DISTINCT properties.distinct_id) AS unique_visitors
FROM events
WHERE event = '$pageview'
  AND properties.$current_url NOT ILIKE '%admin%'
  AND properties.$current_url LIKE '%/catalogues/%'
  AND properties.$current_url NOT ILIKE '%localhost%'
  AND properties.$current_url NOT ILIKE '%//test.%'
  AND timestamp >= toDateTime('${startDate.toISOString()}') 
  AND timestamp < toDateTime('${endDate.toISOString()}')
GROUP BY date, hour, current_url
ORDER BY date DESC, hour DESC
LIMIT 1000000
`,
					},
				}),
				cache: "no-store",
			},
		);

		if (!res.ok) {
			console.error(`PostHog API error: ${res.status} ${res.statusText}`);
			return NextResponse.json(
				{ error: "PostHog API request failed", status: res.status },
				{ status: 500 },
			);
		}

		const eventsData = await res.json();

		// Validate response structure
		if (!eventsData.results || !Array.isArray(eventsData.results)) {
			console.error("Invalid PostHog response structure");
			return NextResponse.json(
				{ error: "Invalid PostHog response" },
				{ status: 500 },
			);
		}

		const analyticsData = eventsData.results
			.map(([date, hour, current_url, pageview_count, unique_visitors]) => {
				const clean_url = current_url?.split("?")[0] || current_url;
				return {
					date,
					hour,
					current_url: clean_url,
					pageview_count,
					unique_visitors,
				};
			})
			.filter(
				(item) => !(item.pageview_count === 0 && item.unique_visitors === 0),
			);

		// Extract unique catalogue names
		const catalogueNames = [
			...new Set(
				analyticsData
					.map((item) => {
						const match = item.current_url.match(/\/catalogues\/([^/]+)/);
						return match ? match[1] : null;
					})
					.filter(Boolean),
			),
		];

		// Query all relevant catalogues
		const { data: catalogues, error: catalogueError } = await supabase
			.from("catalogues")
			.select("name, created_by")
			.in("name", catalogueNames);

		if (catalogueError) {
			console.error("Catalogues query error:", catalogueError);
			return NextResponse.json(
				{ error: catalogueError.message },
				{ status: 500 },
			);
		}

		// Create lookup map
		const nameToUserId = {};
		(catalogues || []).forEach((r) => {
			nameToUserId[r.name] = r.created_by;
		});

		// Add user_id to each analytics row
		let unmatchedUrls = 0;
		const analyticsDataWithUserId = analyticsData.map((item) => {
			const match = item.current_url.match(/\/catalogues\/([^/]+)/);
			const restaurantName = match ? match[1] : null;

			if (!restaurantName) {
				unmatchedUrls++;
				console.warn(`No catalogue name found in URL: ${item.current_url}`);
			}

			return {
				...item,
				user_id: restaurantName ? nameToUserId[restaurantName] : null,
			};
		});

		// Use upsert with ignoreDuplicates to handle conflicts gracefully
		const { data: insertedData, error: insertError } = await supabase
			.from("analytics")
			.upsert(analyticsDataWithUserId, {
				onConflict: "date,hour,current_url",
				ignoreDuplicates: true,
			})
			.select();

		if (insertError) {
			console.error("Insert error:", insertError);

			// Log failure to job_logs if table exists
			await supabase.from("job_logs").insert({
				job_name: "analytics",
				status: "failure",
				processed_count: analyticsDataWithUserId.length,
				inserted_count: 0,
				execution_time_ms: Date.now() - startTime,
				error: insertError.message,
			});

			return NextResponse.json(
				{
					error: "Failed to insert analytics data",
					details: insertError.message,
				},
				{ status: 500 },
			);
		}

		const executionTime = Date.now() - startTime;

		// Log success to job_logs if table exists
		await supabase.from("job_logs").insert({
			job_name: "analytics",
			status: "success",
			processed_count: analyticsDataWithUserId.length,
			inserted_count: insertedData?.length || 0,
			execution_time_ms: executionTime,
			error: null,
		});

		return NextResponse.json(
			{
				message: "Analytics data inserted successfully",
				period: {
					startDate: startDate.toISOString(),
					endDate: endDate.toISOString(),
				},
				summary: {
					fetched: analyticsDataWithUserId.length,
					inserted: insertedData?.length || 0,
					unmatched_urls: unmatchedUrls,
					execution_time_ms: executionTime,
				},
			},
			{ status: 200 },
		);
	} catch (error) {
		console.error("Error in analytics function:", error);

		// Log failure
		try {
			const supabase = await createClient();
			await supabase.from("job_logs").insert({
				job_name: "analytics",
				status: "failure",
				processed_count: 0,
				inserted_count: 0,
				execution_time_ms: Date.now() - startTime,
				error: error instanceof Error ? error.message : String(error),
			});
		} catch {}

		return NextResponse.json(
			{ error: "Error occurred while processing analytics" },
			{ status: 500 },
		);
	}
}
