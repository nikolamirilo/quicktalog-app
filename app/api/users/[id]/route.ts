import { tiers } from "@/constants/pricing"
import { endOfMonth, startOfMonth } from "@/helpers/client"
import { UserData } from "@/types"
import { createClient } from "@/utils/supabase/server"
import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createClient()
    const { id } = await params

    // Fetch user data
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("*")
      .eq("id", id)
      .single()

    if (userError) {
      console.error("Database Error: Failed to fetch user from Supabase.", userError)
      return NextResponse.json({ error: "Failed to retrieve user data" }, { status: 500 })
    }
    if (!user) {
      console.warn(`User data not found for Clerk ID: ${id}.`)
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Find pricing plan
    const pricingPlan = tiers.find((tier) => Object.values(tier.priceId).includes(user.plan_id))
    // Find next plan only if pricingPlan exists
    const nextPlan = pricingPlan ? tiers.find((tier) => tier.id === pricingPlan.id + 1) : null
    const billingPeriod = Object.entries(pricingPlan.priceId).find(
      ([_, id]) => id === user.plan_id
    )?.[0] as "month" | "year"

    // Fetch usage data
    const { data: cataloguesUsage, error: cataloguesUsageError } = await supabase
      .from("catalogues")
      .select("count")
      .eq("created_by", id)

    const { data: trafficUsage, error: trafficUsageError } = await supabase
      .from("analytics")
      .select("pageview_count, unique_visitors")
      .eq("user_id", id)
      .gte("date", startOfMonth.toISOString())
      .lt("date", endOfMonth.toISOString())

    const { data: ocrUsage, error: ocrError } = await supabase
      .from("ocr")
      .select("count")
      .eq("user_id", id)
      .gte("datetime", startOfMonth.toISOString())
      .lt("datetime", endOfMonth.toISOString())
      .single()

    const { data: promptsUsage, error: promptsError } = await supabase
      .from("prompts")
      .select("count")
      .eq("user_id", id)
      .gte("datetime", startOfMonth.toISOString())
      .lt("datetime", endOfMonth.toISOString())
      .single()

    // Check for any usage query errors
    if (cataloguesUsageError || trafficUsageError || ocrError || promptsError) {
      console.error("Usage fetch errors:", {
        cataloguesUsageError,
        trafficUsageError,
        ocrError,
        promptsError,
      })
      return NextResponse.json(
        {
          error: "Failed to fetch usage data",
          details: {
            cataloguesUsageError: cataloguesUsageError?.message,
            trafficUsageError: trafficUsageError?.message,
            ocrError: ocrError?.message,
            promptsError: promptsError?.message,
          },
        },
        { status: 500 }
      )
    }

    // Aggregate traffic usage
    const traffic = trafficUsage?.reduce(
      (acc, curr) => ({
        pageview_count: acc.pageview_count + (curr.pageview_count || 0),
        unique_visitors: acc.unique_visitors + (curr.unique_visitors || 0),
      }),
      { pageview_count: 0, unique_visitors: 0 }
    ) || { pageview_count: 0, unique_visitors: 0 }

    const { cookie_preferences, created_at, customer_id, plan_id, ...adjustedUser } = user
    const userData: UserData = {
      ...adjustedUser,
      pricing_plan: {
        id: pricingPlan.id,
        name: pricingPlan?.name || null,
        description: pricingPlan?.description || null,
        priceId: pricingPlan.priceId || null,
        features: pricingPlan?.features || null,
        next_plan: nextPlan?.name || "Enterprise",
        billing_period: billingPeriod || null,
      },
      usage: {
        traffic,
        ocr: ocrUsage?.count ?? 0,
        prompts: promptsUsage?.count ?? 0,
        catalogues: cataloguesUsage?.[0]?.count ?? 0,
      },
    }

    return NextResponse.json(userData, { status: 200 })
  } catch (error) {
    console.error("Unexpected error in API route:", error instanceof Error ? error.message : error)
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 })
  }
}
