import Analytics from "@/components/admin/dashboard/Analytics"
import Navbar from "@/components/navigation/Navbar"

type tParams = Promise<{ name: string }>
export const dynamic = "force-dynamic"

export default async function page({ params }: { params: tParams }) {
  const { name } = await params
  const transformedName = name
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ")

  let chartData: Array<{ date: string; count: number }> = []
  let rawEvents: Array<{
    timestamp: string
    properties: {
      distinct_id: string
      $browser: string
      $device_type: string
      $geoip_country_name: string
    }
  }> = []
  let error: string | null = null

  try {
    // Validate environment variables
    if (!process.env.NEXT_PUBLIC_POSTHOG_HOST) {
      throw new Error("PostHog host environment variable is not configured")
    }
    if (!process.env.POSTHOG_PROJECT_ID) {
      throw new Error("PostHog project ID environment variable is not configured")
    }
    if (!process.env.NEXT_PUBLIC_POSTHOG_KEY) {
      throw new Error("PostHog API key environment variable is not configured")
    }

    const res = await fetch(
      `${process.env.NEXT_PUBLIC_POSTHOG_HOST}/api/projects/${process.env.POSTHOG_PROJECT_ID}/query/`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.POSTHGOG_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query: {
            kind: "HogQLQuery",
            query: `select timestamp, properties.distinct_id, properties.$browser, properties.$device_type, properties.$geoip_country_name from events where properties.$current_url like '%/${name}%' and event='$pageview' limit 500`,
          },
        }),
        cache: "no-store",
      }
    )

    // Check if the response is ok
    if (!res.ok) {
      const errorText = await res.text()
      throw new Error(`PostHog API request failed: ${res.status} ${res.statusText} - ${errorText}`)
    }

    const data = await res.json()

    // Validate the response structure
    if (!data || typeof data !== "object") {
      throw new Error("Invalid response format from PostHog API")
    }

    if (!Array.isArray(data.results)) {
      throw new Error("PostHog API response missing 'results' array")
    }

    // Transform data.results (array of arrays) into rawEvents
    rawEvents = data.results.map((result: any) => {
      if (!Array.isArray(result) || result.length < 5) {
        throw new Error("Invalid data structure in PostHog results")
      }

      const [timestamp, distinct_id, browser, device_type, country] = result

      return {
        timestamp: String(timestamp || ""),
        properties: {
          distinct_id: String(distinct_id || ""),
          $browser: String(browser || ""),
          $device_type: String(device_type || ""),
          $geoip_country_name: String(country || ""),
        },
      }
    })

    // Group by day for chart data
    const pageViewsByDay = rawEvents.reduce(
      (acc, item) => {
        try {
          const date = new Date(item.timestamp).toISOString().slice(0, 10)
          acc[date] = (acc[date] || 0) + 1
        } catch (dateError) {
          console.warn("Invalid timestamp format:", item.timestamp, dateError)
          // Skip invalid timestamps
        }
        return acc
      },
      {} as Record<string, number>
    )

    chartData = Object.entries(pageViewsByDay)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, count]) => ({ date, count: Number(count) }))
  } catch (err) {
    console.error("Analytics page error:", err)
    error = "Unable to load analytics data at this time. Please try again later."

    // Set default empty data on error
    chartData = []
    rawEvents = []
  }

  return (
    <div className="product font-lora min-h-screen bg-product-background">
      <Navbar />
      <div className="pt-32 md:pt-40 pb-16">
        {error ? (
          <div className="max-w-4xl mx-auto px-4">
            <div className="bg-red-50 border border-red-200 rounded-xl p-6 shadow-product-shadow">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-8 w-8 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <h2 className="text-xl font-semibold text-red-800">Error Loading Analytics</h2>
                  <div className="mt-2 text-sm text-red-700">
                    <p>{error}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
            <div className="max-w-6xl mx-auto px-4">
            <div className="bg-product-background border border-product-border rounded-2xl p-6 md:p-8 shadow-md">
              <div className="text-center mb-8">
                <h1 className="text-4xl lg:text-5xl font-bold text-product-foreground mb-4">
                  Analytics for {transformedName}
                </h1>
                <p className="text-lg text-product-foreground-accent">
                  Track your catalog performance and visitor insights
                </p>
              </div>
              <Analytics data={chartData} rawEvents={rawEvents} />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
