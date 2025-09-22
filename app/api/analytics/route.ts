import { createClient } from "@/utils/supabase/server"
import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    // Adjusted time window to cover last 24 hours only, avoiding future timestamps
    const startDate = new Date(new Date().setDate(new Date().getDate() - 1))
    const endDate = new Date()

    // Fetch from PostHog with parameterized query for safety
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_POSTHOG_HOST}/api/projects/${process.env.POSTHOG_PROJECT_ID}/query/`,
      {
        method: "POST",
        headers: {
          // Fixed typo in environment variable name
          Authorization: `Bearer ${process.env.POSTHOG_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query: {
            kind: "HogQLQuery",
            // Parameterized query to avoid injection risks
            query: `
              SELECT 
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
                AND timestamp >= toDateTime(:startDate)
                AND timestamp < toDateTime(:endDate)
              GROUP BY date, hour, current_url
              ORDER BY date DESC, hour DESC
            `,
            parameters: {
              startDate: startDate.toISOString().replace("Z", "000Z"),
              endDate: endDate.toISOString().replace("Z", "000Z"),
            },
          },
        }),
        cache: "no-store",
      }
    )

    // Check for PostHog API errors
    if (!res.ok) {
      throw new Error(`PostHog API request failed: ${res.statusText}`)
    }

    const eventsData = await res.json()
    const analyticsData = eventsData.results
      .map(([date, hour, current_url, pageview_count, unique_visitors]) => ({
        date,
        hour,
        current_url: current_url?.split("?")[0] || current_url,
        pageview_count,
        unique_visitors,
      }))
      .filter((item) => item.pageview_count > 0 || item.unique_visitors > 0)

    // Extract unique restaurant names
    const catalogueNames = [
      ...new Set(
        analyticsData
          .map((item) => item.current_url.match(/\/catalogues\/([^/]+)/)?.[1])
          .filter(Boolean)
      ),
    ]

    // Query catalogues
    const { data: catalogues, error: catalogueError } = await supabase
      .from("catalogues")
      .select("name, created_by")
      .in("name", catalogueNames)

    if (catalogueError) {
      // Improved error handling with specific message
      throw new Error(`Supabase catalogue query failed: ${catalogueError.message}`)
    }

    // Create map for user IDs
    const nameToUserId = Object.fromEntries(catalogues.map((r) => [r.name, r.created_by]))

    // Add user_id and log missing mappings
    const analyticsDataWithUserId = analyticsData.map((item) => {
      const restaurantName = item.current_url.match(/\/catalogues\/([^/]+)/)?.[1]
      return {
        ...item,
        user_id: restaurantName ? nameToUserId[restaurantName] : null,
      }
    })

    // Log missing catalogue mappings for debugging
    const missingCatalogues = analyticsDataWithUserId
      .filter((item) => !item.user_id)
      .map((item) => item.current_url)
    if (missingCatalogues.length > 0) {
      console.warn("Missing catalogue mappings for URLs:", missingCatalogues)
    }

    // Bulk upsert to improve performance
    const { data, error } = await supabase.from("analytics").upsert(analyticsDataWithUserId, {
      onConflict: "analytics_unique_date_hour_url",
    })

    if (error) {
      // Improved error handling for upsert
      console.error("Supabase upsert error:", error)
      return NextResponse.json(
        { error: "Failed to process some records", details: error.message },
        { status: 500 }
      )
    }

    // Simplified response with key metrics
    return NextResponse.json({
      message: "Analytics processed successfully",
      options: {
        startDate: startDate.toISOString().replace("Z", "000Z"),
        endDate: endDate.toISOString().replace("Z", "000Z"),
      },
      processedRecords: analyticsDataWithUserId.length,
      summary: {
        total: analyticsDataWithUserId.length,
        missingCatalogues: missingCatalogues.length,
      },
    })
  } catch (error) {
    // Enhanced error logging and response
    console.error("Error in analytics function:", {
      message: error.message,
      stack: error.stack,
    })
    return NextResponse.json(
      { error: "Failed to process analytics", details: error.message },
      { status: 500 }
    )
  }
}
