import { createClient } from "@/utils/supabase/server"
import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const startDate = new Date(new Date().setDate(new Date().getDate() - 2))
    const endDate = new Date(new Date().setDate(new Date().getDate() + 1))
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_POSTHOG_HOST}/api/projects/${process.env.POSTHOG_PROJECT_ID!}/query/`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.POSTHOG_API_KEY!}`,
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
  AND timestamp >= toDateTime('${startDate.toISOString().replace("Z", "000Z")}') 
  AND timestamp < toDateTime('${endDate.toISOString().replace("Z", "000Z")}')
GROUP BY date, hour, current_url
ORDER BY date DESC, hour DESC`,
          },
        }),
        cache: "no-store",
      }
    )

    const eventsData = await res.json()

    const analyticsData = eventsData.results
      .map(([date, hour, current_url, pageview_count, unique_visitors]) => {
        const clean_url = current_url?.split("?")[0] || current_url
        return {
          date,
          hour,
          current_url: clean_url,
          pageview_count,
          unique_visitors,
        }
      })
      .filter((item) => !(item.pageview_count === 0 && item.unique_visitors === 0))

    // 1. Extract unique restaurant names from analyticsData
    const catalogueNames = [
      ...new Set(
        analyticsData
          .map((item) => {
            const match = item.current_url.match(/\/catalogues\/([^/]+)/)
            return match ? match[1] : null
          })
          .filter(Boolean)
      ),
    ]

    // 2. Query all relevant catalogues in one go
    const { data: catalogues, error: catalogueError } = await supabase
      .from("catalogues")
      .select("name, created_by")
      .in("name", catalogueNames)

    if (catalogueError) {
      return NextResponse.json({ error: catalogueError.message }, { status: 500 })
    }

    // 3. Create a map for quick lookup
    const nameToUserId = {}
    ;(catalogues || []).forEach((r) => {
      nameToUserId[r.name] = r.created_by
    })

    // 4. Add user_id to each analytics row
    const analyticsDataWithUserId = analyticsData.map((item) => {
      const match = item.current_url.match(/\/catalogues\/([^/]+)/)
      const restaurantName = match ? match[1] : null
      return {
        ...item,
        user_id: restaurantName ? nameToUserId[restaurantName] : null,
      }
    })

    // 5. Process each record individually to handle additive behavior
    const processedResults = []
    const errors = []

    for (const item of analyticsDataWithUserId) {
      try {
        // Check if record exists
        const { data: existing, error: selectError } = await supabase
          .from("analytics")
          .select("pageview_count, unique_visitors")
          .eq("date", item.date)
          .eq("hour", item.hour)
          .eq("current_url", item.current_url)
          .maybeSingle() // Use maybeSingle instead of single to avoid errors when no record found

        if (selectError) {
          errors.push({ item, error: selectError })
          continue
        }

        if (existing) {
          // Record exists - add to existing values
          const { data, error } = await supabase
            .from("analytics")
            .update({
              pageview_count: existing.pageview_count + item.pageview_count,
              unique_visitors: existing.unique_visitors + item.unique_visitors,
              user_id: item.user_id, // Update user_id in case it changed
            })
            .eq("date", item.date)
            .eq("hour", item.hour)
            .eq("current_url", item.current_url)

          if (error) {
            errors.push({ item, error })
          } else {
            processedResults.push({
              action: "updated",
              item,
              previous: existing,
              newValues: {
                pageview_count: existing.pageview_count + item.pageview_count,
                unique_visitors: existing.unique_visitors + item.unique_visitors,
              },
            })
          }
        } else {
          // Record doesn't exist - insert new
          const { data, error } = await supabase.from("analytics").insert([item])

          if (error) {
            errors.push({ item, error })
          } else {
            processedResults.push({ action: "inserted", item })
          }
        }
      } catch (err) {
        errors.push({ item, error: err })
      }
    }

    if (errors.length > 0) {
      console.error("Processing errors:", errors)
      return NextResponse.json(
        {
          error: "Some records failed to process",
          details: errors,
          successful: processedResults,
        },
        { status: 207 }
      ) // 207 = Multi-Status
    }

    return NextResponse.json(
      {
        message: "Analytics processed successfully with additive behavior",
        options: {
          startDate: startDate.toISOString().replace("Z", "000Z"),
          endDate: endDate.toISOString().replace("Z", "000Z"),
        },
        inputData: analyticsData,
        processedResults: processedResults,
        summary: {
          total: analyticsDataWithUserId.length,
          inserted: processedResults.filter((r) => r.action === "inserted").length,
          updated: processedResults.filter((r) => r.action === "updated").length,
          failed: errors.length,
        },
      },
      { status: 200 }
    )
  } catch (error) {
    console.error("Error in analytics function:", error)
    return new Response("Error occurred while processing analytics.", { status: 500 })
  }
}
